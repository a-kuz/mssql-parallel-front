<template>
	<v-layout column pa-2 ma-z>
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

			<v-tabs v-model="tab" right>
				<v-tab router-link to="/dev">
					T-SQL
				</v-tab>
				<v-tab router-link to="/otk">
					OTK
				</v-tab>
			</v-tabs>

			<v-dialog v-model="PreferencesDialog" max-width="650px">
				<template v-slot:activator="{ on }">
					<v-btn v-on="on" slot="activator" icon
						><v-icon>mdi-settings</v-icon>
					</v-btn>
				</template>
				<v-card>
					<v-card-title>
						<span class="headline">Settings</span>
					</v-card-title>
					<v-card-text>
						<v-container grid-list-md>
							<v-form>
								<v-text-field
									label="backend"
									v-model="backendUrl"
									hint="ws://10.1.2.2:3003"
								>
								</v-text-field>

								<v-switch v-model="denseTable" label="Small table"></v-switch>

								<v-switch v-model="dark" label="dark"></v-switch>
							</v-form>
						</v-container>
					</v-card-text>

					<v-card-actions>
						<v-spacer></v-spacer>

						<v-btn
							color="blue darken-1"

							@click.native="PreferencesDialog = false"
							>Save</v-btn
						>
					</v-card-actions>
				</v-card>
			</v-dialog></v-app-bar
		>

		<v-row>{{ serverList }}</v-row>
		<v-alert
			v-for="alert in alerts"
			:key="alert.key"
			border="left"
			:type="alert.type"
			:dismissible="alert.dismissible"
			@input.native="deleteAlert(alert)"
			@click.native="deleteAlert(alert)"
		>
			{{ alert.text }}
		</v-alert>

		<v-flex row pa-2>
			<v-flex
				v-for="report in reports"
				:key="report.id"
				:pa-6="!report.selected"
				justify-start
				align-start
				pa-2
				:pa-1="report.selected && isStarted"
			>
				<v-card
					outlined
					ripple
					hover
					@click.native="doIt(report)"
					:class="{
						'fill-height selected-card card  elevation-24  ': report.selected,
						'fill-height  card elevation-1 ': !report.selected
					}"
				>
					<v-layout column>
						<v-card-title class="title ">
							<v-layout row px-2>
								{{ report.title }}

								<v-spacer></v-spacer>
								<v-layout column align-content-start justify-start align-end>
									<v-btn
										right
										:class="{
											'v-btn--outlined': report.selected,
											'elevation-12': !report.selected
										}"
										:color="report.color"

										:clickable="!report.selected"
										v-if="!isStarted || !report.selected || isDone"
									>
										<v-icon
											left
											color="success"
											v-if="report.selected && isDone"
											>mdi-check</v-icon
										>
										<v-icon left v-else-if="report.selected && !isDone"
											>mdi-loading</v-icon
										>
										<v-icon left v-else>mdi-play</v-icon>
										<bl v-if="report.selected && isDone">{{
											" " + items.length + " rows "
										}}</bl>
										<bl v-else>СФОРМИРОВАТЬ</bl>
									</v-btn>
								</v-layout>

								<v-btn
									v-if="!(!isStarted || !report.selected) && !isDone"
									loading
								></v-btn>
								<v-spacer v-if="report.selected && isDone"></v-spacer>
								<v-btn pa-3 right v-if="report.selected && isDone">
									<v-icon left>mdi-update</v-icon>ЕЩЕ РАЗОК</v-btn
								>
							</v-layout>
						</v-card-title>

						<v-progress-linear
							:active="isDone"
							v-if="isStarted && report.selected"
							:normalized-buffer="totalInstances"
							color="primary"
							v-bind="progress"
							height=20
						>
						  <template v-slot="{ value }">
        <strong>{{
								Math.round((progress.value * totalInstances) / 100) +
									" / " +
									totalInstances
							 }}%</strong>
      </template>

						</v-progress-linear>
						<v-card-text vcardtex class=" body-3 sql flex-sm-shrink-0">{{
							report.description.trim()
						}}</v-card-text>
						<v-row fill-height></v-row>
						<v-space></v-space>
					</v-layout>
					<v-layout align-center pa-2>
						<code v-if="isStarted && !isDone && report.selected">{{
							" " + items.length + " rows "
						}}</code>
					</v-layout>
				</v-card>
			</v-flex>
		</v-flex>

		<v-flex pa-1>
			<v-card>
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
	</v-layout>
</template>
<script>
import * as ws from "socket.io-client";
import MyDataTable from "./MyDataTable.vue";
import Reports from "../reports.js";
export default {
	wsCli: undefined,
	name: "MyReportsDev",
	components: { MyDataTable },

	data: () => ({
		serverList: [],
		PreferencesDialog: false,
		backendUrl: `ws://10.1.2.2:3002`,
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
		denseTable: false,
		items: [],
		alerts: [],
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
		this.wsCli.emit("serverList");
		this.wsCli.on("serverList", serverList => {
			console.log("serverList:", serverList);
			this.serverList = serverList;
		});
	},

	methods: {
		deleteAlert(alert) {
			this.alerts = this.alerts.filter(e => e.key != alert.key);
		},
		alert(text, type) {
			let key = Math.round(Math.random() * 10000);
			let alert = { text, key, error: true, dismissible: true, type };
			this.alerts.push(alert);
		},
		errorMessage(text) {
			this.alert(text, "error");
		},
		doIt(report) {
			this.sql = report.sql;
			report.selected = true;

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
			this.wsCli = ws.connect(this.backendUrl, {
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
			this.reports.forEach(e => {
				e.selected = sql == e.sql ? 1 : 0;
				e.color = "";
			});
			this.wsState = sql;
			if (wsCli === undefined) {
				wsCli = ws.connect(this.backendUrl, {
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
				wsCli = ws.connect(this.backendUrl);
				this.isStarted = true;
				this.isDone = false;
			}
			wsCli.send(sql);
			this.reports.forEach(e => {
				if (e.selected) {
					e.color = "success";
				} else {
					e.color = "";
				}
			});
			wsCli.on("end", ev => {
				clearInterval(this.timerId);
				this.isDone = true;
				this.reports.forEach(e => {
					if (e.selected) {
						e.color = "success";
					}
				});
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
								if (e !== "id" && e !== "ib_href") {
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
	/* font-family: "Roboto mono", Consolas; */
	white-space: pre;
	overflow: hidden;
	text-overflow: ellipsis;
	overflow-anchor: none;
	overflow-wrap: break-word;
	font-weight: 300;
}
.selected-card {
	min-height: 200px;
	border: 3px solid white !important;
}
.card {
	min-width: 0px;
}
.card-title {
	font-size: 1.2em;
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
		border-color: rgba(99, 99, 99, 1);
	}

	30% {
		border-color: rgba(100, 144, 144, 1);
	}

	50% {
		border-color: rgba(99, 111, 100, 1);
	}

	70% {
		border-color: rgba(99, 100, 144, 1);
	}

	99% {
		border-color: rgba(99, 100, 99, 1);
	}
}

@keyframes anime2 {
	0% {
		color: rgba(99, 99, 99, 1);
	}

	50% {
		color: rgba(99, 111, 100, 1);
	}
	60% {
		color: rgba(100, 144, 144, 1);
	}

	70% {
		color: rgba(99, 100, 144, 1);
	}

	88% {
		color: rgba(99, 100, 99, 1);
		99% {
			color: rgba(99, 99, 99, 1);
		}
		100% {
			color: rgba(99, 99, 99, 1);
		}
	}
}

.animated {
	animation: anime infinite 7s !important;
}

.animated2 {
	animation: anime2 infinite 7s ease !important;
}
</style>
