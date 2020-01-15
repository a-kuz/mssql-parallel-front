<template>
	<v-container>
		<v-navigation-drawer v-model="drawer" clipped app width="130">
			<v-list-item>
				<v-list-item-content>
					<v-switch v-model="denseTable" label="small" tabindex="1"></v-switch>
				</v-list-item-content>
			</v-list-item>
			<v-list-item>
				<v-list-item-content>
					<v-switch v-model="isStarted" tabindex="2" label="started"></v-switch>
				</v-list-item-content>
			</v-list-item>

			<v-list-item>
				<v-list-item-content>
					<v-checkbox v-model="dark" dense label="dark"></v-checkbox>
				</v-list-item-content>
			</v-list-item>
		</v-navigation-drawer>

		<v-app-bar app clipped-left :dense="denseTable">
			<v-app-bar-nav-icon @click="appNavClick"></v-app-bar-nav-icon>

			<v-progress-linear
				:active="isDone != true && isStarted"
				:normalized-buffer="totalInstances"
				color="primary"
				v-bind="progress"
				height="30"
			>
				{{
					Math.round((progress.value * totalInstances) / 100) +
						" / " +
						totalInstances
				}}
			</v-progress-linear>
			<v-tabs v-model="tab" right>
				<v-tab router-link to="/dev">
					T-SQL
				</v-tab>
				<v-tab router-link to="/otk">
					OTK
				</v-tab>
			</v-tabs>
		</v-app-bar>

		<v-flex row>
			<v-flex
				v-for="report in reports"
				:key="report.id"
				pa-2
				justify-start
				align-start
			>
				<v-card ripple hover @click.native="doIt(report)">
					<v-card-title>
						{{ report.title }}
					</v-card-title>
					<v-divider></v-divider>
					<v-card-text vcardtex class="sql"
						>{{ report.description }}
					</v-card-text>
					<v-flex right align-content-end justify-end row>
						<v-spacer></v-spacer>
						<v-card-actions>
							<v-btn flat outlined>
								<v-icon color="green">mdi-play</v-icon>
								СФОРМИРОВАТЬ
							</v-btn>
						</v-card-actions>
					</v-flex>
				</v-card>
			</v-flex>
		</v-flex>

		<v-flex pa-1>
			<v-card >


			<my-data-table
				:dense-table="denseTable"
				v-if="isStarted"
				:items="items"
				:headers="headers"
				:headers-edited="headersEdited"
				:all-headers="allHeaders"
			></my-data-table>




	</v-card>
	<v-container grid-list-xs>


			<v-combobox
			ma-2
			pa-2

				v-if="isStarted"
				v-model="headersEdited"
				chips
				clearable
				multiple
				prepend-icon="mdi-view-week"
				solo
				@click:clear="resetHeaders"
			>
				<template v-slot:selection="{ attrs, item, select, selected }">
					<v-chip
						:input-value="selected"
						@click.native="removeHead(item)"
						@click:close="removeHead(item)"
						>{{ item.text }}</v-chip
					>
				</template>
			</v-combobox>
</v-container>

		</v-flex>
	</v-container>
</template>
<script>
import * as ws from "socket.io-client";
import MyDataTable from "./MyDataTable.vue";
import Reports from "../reports.js";
export default {
	wsCli: undefined,
	name: "MyReports",
	components: { MyDataTable },

	data: () => ({
		isStarted: false,
		tab: 1,
		banner: false,
		timerId: 0,
		wsState: "not started",
		footerProps: {
			"disable-pagination": false,
			"disable-items-per-page": false,
			"items-per-page-all-text": "All",
			itemsPerPageOptions: [30, 100, 250, 2000, -1]
		},
		denseTable: true,
		items: [],
		history: [],
		buffer: [],
		headers: [],
		allHeaders: [],
		headersEdited: [],
		isDone: false,
		drawer: false,
		groupBy: [],
		progress: { bufferValue: 0, value: 0 },
		totalInstances: 0,
		reports: Reports
	}),
	computed: {
		dark: {
			get() {
				return this.$vuetify.theme.dark;
			},
			set(v) {
				this.$vuetify.theme.dark = v;
			}
		}
	},
	beforeCreate() {
		window.Vue = this;
		window.wsCli = this.wsCli;
		this.$on("inputSQL", value => {
			this.wsState = value;
		});
	},

	mounted() {
		this.$on("inputSQL", value => {
			this.wsState = value;
		});

		this.connect();
	},

	methods: {
		doIt(report) {
			this.sql = report.sql;

			this.submit();
		},

		appNavClick() {
			this.drawer = !this.drawer;
			globalThis.Vue = this;
		},
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
		},
		async updateTable() {
			let copyOfBuffer = this.buffer.filter(() => {
				return 1;
			});
			this.buffer = [];
			copyOfBuffer.forEach(element => {
				this.items.push(element);
			});
		},
		async connect() {
			this.wsCli = ws.connect("ws://10.1.2.2:3002", {
				randomizationFactor: 0.1,
				reconnectionDelayMax: 700,
				reconnectionDelay: 80
			});
		},

		async submit() {
			var wsCli = this.wsCli;
			try {
				clearInterval(this.timerId);
			} catch (error) {}
			let sql = this.sql;
			this.wsState = sql;
			if (wsCli === undefined) {
				wsCli = ws.connect("ws://10.1.2.2:3002", {
					randomizationFactor: 0.1,
					reconnectionDelayMax: 700,
					reconnectionDelay: 80
				});

				this.isStarted = true;
			} else {
				this.items = [];
				this.buffer = [];
				this.headers = [];
				this.allHeaders = [];
				this.headersEdited = [];
				wsCli = ws.connect("ws://10.1.2.2:3002");
				this.isStarted = true;
				this.isDone = false;
			}
			wsCli.send(sql);
			wsCli.on("end", ev => {
				clearInterval(this.timerId);
				this.isDone = true;
			});
			wsCli.on("error", err => {
				console.error(err);
				alert(err);
			});
			wsCli.on("progress", async progressData => {
				this.progress = progressData;
			});
			wsCli.on("start", startData => {
				this.timerId = setInterval(this.updateTable, 1000);
				//window.alert(JSON.stringify(startData))
				this.totalInstances = startData.totalInstances;
			});
			wsCli.on("message", async objcts => {
				objcts.forEach(ev => {
					if (Object.keys(ev).length > 2) {
						this.buffer.push(ev);
						if (this.headers.length == 0) {
							Object.keys(ev).forEach(e => {
								let h = {
									text: e,
									value: e,
									selected: false,
									filterable: true
								};
								if (e !== "id") {
									this.headers.push(h);
									this.allHeaders.push(h);
									this.headersEdited.push(h);
								}
							});
						}
					}
				});
			});
		}
	}
};
</script>
<style>
.cls {

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

.sql {
	font-family: "Roboto mono", Consolas;
	white-space: pre;
	overflow: hidden;
	text-overflow: ellipsis;
	overflow-anchor: none;
	overflow-wrap: break-word;
}
.card {
	min-width: 0px;
}
</style>
