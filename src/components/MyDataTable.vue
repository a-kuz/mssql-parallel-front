<template>
<v-container>

			<v-data-table

				show-group-by
				:group-by="groupBy"
				:dense="denseTable"
				:headers="headers"
				:items="items"
				multi-sort
				no-data-text="No records returned. Usaly, it mean that recordsets was empty or T-SQL query had syntax error"
				custom-filter="{Function}"
				selection
				calculate-widths
				:footer-props="footerProps"
				:items-per-page="30"
				:disable-pagination="false"
				item-key="id"
			></v-data-table>


			</v-container>
</template>
<script>


export default {

	name: "MyDataTable",
	props:{denseTable: Boolean,items: Array,headers: Array,headersEdited: Array,allHeaders:Array},


	data: () => ({




		footerProps: {
			"disable-pagination": false,
			"disable-items-per-page": false,
			"items-per-page-all-text": "All",
			itemsPerPageOptions: [30, 100, 250, 2000, -1]
		},
		denseTable: true,
		headers:[ {
									text: 'test',
									value: 'test'


								}],
		items:[{test:'test'}],allHeaders:[ {
									text: 'test',
									value: 'test'


								}],headersEdited:[ {
									text: 'test',
									value: 'test'


								}],





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
<style scoped>
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
</>
