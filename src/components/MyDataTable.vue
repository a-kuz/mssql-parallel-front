<template>
	<div>
		<v-data-table
			class="data-table-text"
			:show-group-by="showGroupBy"
			:group-by="groupBy"
			:dense="denseTable"
			:headers="headers"
			:items="items"
			multi-sort
			no-data-text="No records returned. Usaly, it mean that recordsets was empty or T-SQL query had syntax error"
			:calculate-widths="calculateWidths"
			:footer-props="footerProps"
			:items-per-page="30"
			:disable-pagination="false"
			item-key="id"
		>
			<template v-slot:item.ref="{ item }">
				<v-btn rounded left color="primary" :href="item.ref" target="_blank">
					<small>
						<v-icon small left target="_blank" :href="item.ref"
							>mdi-launch</v-icon
						>
						открыть протокол</small
					>
				</v-btn>
			</template>

			<template v-slot:item.ib="{ item }">
				<v-layout
					pa-1
					width="10px"
					max-width="10px"
					row
					align-center=""
					align-content-center=""
				>
					<v-btn
						dense
						mini-variant
						height="30"
						pa-2
						pb-3
						rounded
						target="_blank"
						:href="item.ib_href"
						:color="
							item.ib % 4 == 0
								? 'warning'
								: item.ib % 4 == 1
								? 'light-green'
								: item.ib % 4 == 2
								? 'error'
								: 'primary'
						"
						><small>{{ item.ib }}</small>
						<v-icon mini-variant right>mdi-launch</v-icon>
					</v-btn>
				</v-layout>
			</template>

			<template v-slot:header.ib="{}">
				<v-layout column centered align-center justify-center="">
					ТТ
					<small>(кликабельно)</small>
				</v-layout>
			</template>

			<template v-slot:item.Слип="{ item }">
				<code class="slip elevation-24">{{ item.Слип }}</code>
			</template>

			<template v-slot:item.Комментарий="{ item }">
				<small class="monospace1">{{ item.Комментарий }}</small>
			</template>

			<template v-slot:item.Статус="{ item }">
				<v-chip pa-1 color="green" v-if="item.Статус == 'Открыт'">{{
					item.Статус
				}}</v-chip>
				<v-chip color="red" v-else-if="item.Статус == 'Удален'">{{
					item.Статус
				}}</v-chip>
				<v-chip color="warning" v-else>{{ item.Статус }}</v-chip>
			</template>
			<template v-slot:item.товары="{ item }">
				<code class="slip elevation-24">
					<v-flex
						v-for="tovar in item.товары
							.split(';')
							.filter((v, i) => {
								if (item.товары.split(';').indexOf(v) == i) {
									return 1;
								}
							})
							.map(e => {
								return e.slice(0, 250) + (e.length > 250 ? ' ...' : '');
							})"
						:key="tovar"
						>{{ tovar }}</v-flex

					>
					<br/><hr/><br/>
					<v-layout width="100%" align-content-end="" align-end d-flex full-width fluid>
 <v-label bigga width="100%" class="display-2 monospace right">= {{item.Сумма}} ₽</v-label>
					</v-layout>

				</code>
			</template>
			<template v-slot:item.Дата="{ item }">
				{{
					item.Дата
						.replace(/T/, " ")
						.replace(/\-/g, ".")
						.replace(/\.\d\d\dZ/, "")
				}}</template
			>
		</v-data-table>
	</div>
</template>

<script>
export default {
	name: "MyDataTable",
	props: {
		denseTable: Boolean,
		showGroupBy: Boolean,
		calculateWidths: Boolean,
		items: Array,
		headers: Array,
		headersEdited: Array,
		allHeaders: Array
	},

	data: () => ({
		footerProps: {
			"disable-pagination": false,
			"disable-items-per-page": false,
			"items-per-page-all-text": "All",
			itemsPerPageOptions: [30, 100, 250, 2000, -1]
		},
		denseTable: true,



		groupBy: []
	}),

	methods: {
		removeHead(item) {
			this.headersEdited = this.headersEdited.filter(e => e.text !== item.text);
			this.headers = this.headers.filter(e => e.text !== item.text);
		},
		resetHeaders() {
			this.headersEdited = this.allHeaders;
			this.headers = this.allHeaders;
		},
		select(item) {
			console.log(item);
		}
	}
};
</script>

<style lang="css">
.cls {
	max-width: max-content;
	width: 100%;
	min-width: fit-content;
	align-content: flex-end;
	display: flexbox;
}
.cls2 {
	inline-size: initial;
	align-content: flex-end;
	justify-self: flex-end;
	display: flex;
	align-self: flex-end;
	justify-content: flex-end;
}
@keyframes anime {
	0% {
		background-color: rgba(66, 66, 66, 1);
	}

	50% {
		background-color: rgba(99, 99, 99, 1);
	}
}

.animated {
	animation: anime infinite 6s ease !important;
}

.monospace1 {
	font-family: Consolas;
}
.slip {
	padding-bottom: 30px;
	padding-top: 30px;
	padding-left: 15px;
	padding-right: 15px;
	font-family: system, monospace;
	margin: 10px;
	background-color: #eee !important;
	border-radius: 1px !important;
	color: blue !important;
	box-shadow: 0 0 1in -0.25in rgba(0, 0, 0, 0.5);
}

.check {
	padding-bottom: 30px;
	padding-top: 30px;
	padding-left: 15px;
	padding-right: 15px;
	font-family: system, monospace;
	margin: 10px;
	background-color: #eee !important;
	border-radius: 1px !important;
	color: blue !important;
	box-shadow: 0 0 1in -0.25in rgba(0, 0, 0, 0.5);
}
.bigga {
	font-size: 3ch
}
</style>
