var reports = [{
		id: 1,
		title: "Нефискализированные протоколы с проведенной оплатой банковской картой",
		sql: `
		SELECT
	Дата,
	RIGHT(НОМЕР, 8) Номер,
	СТРОКИ.СУММА Сумма
	,сз.Синоним Статус,
	Слип,
	left(substring(right(ОТВЕТФН,50),PATINDEX('%"[а-Я][а-Я]%[а-Я][а-Я]"%', right(ОТВЕТФН,50))+1,100),charindex('"',substring(right(ОТВЕТФН,50),PATINDEX('%"[а-Я][а-Я]%[а-Я][а-Я]"%', right(ОТВЕТФН,50))+1,100))-1) Ошибка,

	substring((select '; '+Наименование as [text()] from Документ_Заказ_Товары зт join Справочник_Товары т on зт.Товар = т.Ссылка where зт.Ссылка = п.Заказ_Ссылка order by НомерСтроки for xml path('')),2,1000) as товары,
	Рм.Наименование РМ,'HTTP://' + CAST(CAST(RIGHT(СПРИБ.КОД, 4) AS INT) AS VARCHAR(MAX)) + '-SERV.TT' + Р.НАИМЕНОВАНИЕ + '.LOCAL:85/SUP_KKM/RU#e1cib/data/Документ.ПротоколРасчетов?ref=' + CONVERT(VARCHAR(32), П.ССЫЛКА, 2) AS ref

FROM
	ДОКУМЕНТ_ПРОТОКОЛРАСЧЕТОВ П
	JOIN ДОКУМЕНТ_ПРОТОКОЛРАСЧЕТОВ_ПРОТОКОЛ СТРОКИ ON СТРОКИ.ССЫЛКА = П.ССЫЛКА
	JOIN СПРАВОЧНИК_ВАРИАНТЫОПЛАТЫ ВА ON ВА.ССЫЛКА = ВАРИАНТОПЛАТЫ
	AND ВА.НАИМЕНОВАНИЕ = 'КАРТА'
	JOIN СПРАВОЧНИК_ФИРМЫ Ф ON Ф.ССЫЛКА = ФИРМА
	JOIN СПРАВОЧНИК_ИНФОРМАЦИОННЫЕБАЗЫ СПРИБ ON Ф.ИНФОРМАЦИОННАЯБАЗА = СПРИБ.ССЫЛКА
	JOIN СПРАВОЧНИК_РЕГИОНЫ Р ON СПРИБ.РЕГИОН = Р.ССЫЛКА
	JOIN Справочник_РабочиеМеста Рм ON п.РабочееМесто = Рм.ССЫЛКА
	join РегистрСведений_ЗаказДопИнф зди on зди.Заказ = п.Заказ_Ссылка
	join Перечисление_СтатусыЗаказа сз on сз.Ссылка = зди.Статус
WHERE
	СЛИП <> ''
	AND ФИСКАЛИЗИРОВАН = 0
	AND ДАТА > '20200101'
	AND ДАТА < DATEADD(MINUTE, -15, GETDATE())
	AND П.ПОМЕТКАУДАЛЕНИЯ = 0`,
		selected: 0,
		description: ""
	},
	{
		id: 10,
		title: "Ошибки ЕГАИС",
		sql: `select * into #t from журналРегистрации_просмотр where событие = 'ЕГАИС'
		select Дата,Комментарий,Сотрудник, Данные_Представление Заказ, Компьютер  from #t where комментарий like 'Запрос%проверка%'  AND ДАТА > DATEADD(DAY,-3,GETDATE()) order by дата desc`,
		selected: 0,
		description: "Недавние ошибки УТМ"
	}
	,
	{
		id: 2,
		title: "Отчеты ФО с суммой корр",
		description: "",
		sql: `select Дата, Номер, СуммаКорр from документ_отчетфо where СуммаКорр >0 and пометкаудаления = 0`,
		selected: 0
	},
	{
		id: 3,
		title: `Одновременно открыто несколько смен`,
		description: `Проверка больше одной открытой кассовой смены по одной кассе без связанного документа закрытия кассовых смены.
Пример: на одной кассе открыто две и более кассовых смены без документа закрытия данной смены`,
		sql: `SELECT
  КассаНомер
  , count(DISTINCT Откр.Ссылка) СменОткрыто
  , min(Откр.Дата) Дата
  , max(Откр.Дата) Дата2
FROM
  Документ_Касса_ОткрытиеСмены Откр
LEFT JOIN
  Документ_Касса_ЗакрытиеСмены Закр
  ON Закр.СменаКассы = Откр.Ссылка
WHERE
  Закр.Ссылка IS NULL
  AND
  Откр.ПометкаУдаления = 0
GROUP BY
КассаНомер
HAVING
COUNT(DISTINCT ОТКР.Ссылка) > 1`,
		selected: 0
	},
	{
		id: 4,
		title: `Поиск смен с одинаковым номером в разных датах`,
		description: `Кассовая смена может открыться с тем же номером, что использовался в предыдущей смене.
В результате в шапке реализации нет данных по кассовой смены (контрольные суммы)`,
		sql: `SELECT
  КассаНомер
  , НомерСмены
  , КассаЗаводскойФН
  , КассаЗаводскойНомер
  , count(DISTINCT ОТКР.Ссылка) КоличествоСмен
  , min(Откр.Дата) ДопИнфо_ДатаМин
  , max(Откр.Дата) ДопИнфо_ДатаМакс
FROM
 Документ_Касса_ОткрытиеСмены Откр
WHERE
 Откр.ПометкаУдаления = 0
GROUP BY
КассаНомер, НомерСмены, КассаЗаводскойФН, КассаЗаводскойНомер
HAVING
COUNT(DISTINCT ОТКР.Ссылка) > 1`,
		selected: 0
	},
	{
		id: 5,
		title: `Поиск дубля номера чека`,
		description: `
Поиск протоколов с одинаковым номером чека, кассой,сменой в разрезе одной даты
Если оба фискализированы, то в ответе ФН одного из заказов будет стоять другой номер чека.
В одном из заказов в ответе ФН ошибка, заказ не фискализирован, но галка фискализации может стоять
	`,
		sql: `IF OBJECT_ID('tempdb..#t') IS NOT NULL DROP TABLE #t
  SELECT
	  НомерЧека,
	  прото.НомерСмены,
	  смена.КассаНомер,
	  прото.Номер,
	  прото.Ссылка ПротоколРасчетов,
	  CAST(прото.Дата AS DATE) Дата
  INTO #t
  FROM
	  Документ_ПротоколРасчетов прото
	  JOIN Документ_Касса_ОткрытиеСмены смена
	  ON прото.КассоваяСмена = смена.Ссылка
  WHERE прото.Фискализирован = 1

  SELECT
	  t1.Дата,
	  t1.КассаНомер,
	  t1.НомерСмены,
	  t1.НомерЧека,
	  t1.Номер,
	  t2.Номер
  FROM
	  #t t1,
	  #t t2
  WHERE
	  t1.НомерЧека = t2.НомерЧека AND
	  t1.НомерСмены = t2.НомерСмены AND
	  t1.КассаНомер = t2.КассаНомер AND
	  t1.ПротоколРасчетов > t2.ПротоколРасчетов AND
	  t1.Дата = t2.Дата`,
		selected: 0
	}
].sort((v,v2)=>v.id<v2.id ? -1 : 0);
export default reports;