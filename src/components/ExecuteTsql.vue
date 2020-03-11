<template>
	<v-layout pa-1 ma-1>
		<v-app-bar app clipped-left :dense="denseTable">
			<v-btn
				:loading="!isDone  && isStarted"
				type="link"
				:color="isDone ? 'primary' : ''"
				@click="submit"
				:disabled="!canDo"
				absolute
				fixed
				color="red"
			>

				<v-icon v-if="isDone">mdi-home</v-icon>
				<v-icon v-if="!isStarted">mdi-play</v-icon>
				<v-icon v-else-if="!isDone">mdi-stop</v-icon>


				{{ this.isDone ? "NEW" : this.isStarted ? "STOP" : "GO" }}
			</v-btn>
			<v-progress-linear
				:active="isDone != true && isStarted"
				:normalized-buffer="totalInstances"
				color="primary"
				v-bind="progress"
				height="30"
				full-width
			>
				{{
					Math.round((progress.value * totalInstances) / 100) +
						" / " +
						totalInstances
				}}
			</v-progress-linear>

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
									hint="ws://10.1.2.2:3002"
								>
								</v-text-field>

								<v-switch v-model="denseTable" label="Small table"></v-switch>
								<v-switch
									v-model="showGroupBy"
									label="Grouping feature"
								></v-switch>

								<v-switch v-model="dark" dense label="dark"></v-switch>
							</v-form>
						</v-container>		
					</v-card-text>

					<v-card-actions>
						<v-spacer></v-spacer>

						<v-btn
							color="blue darken-1"
							text
							@click.native="PreferencesDialog = false"
							>Save</v-btn
						>
					</v-card-actions>
				</v-card>
			</v-dialog>
			<v-tabs v-model="tab" right>
				<v-tab router-link to="/dev">
					T-SQL
				</v-tab>
				<v-tab router-link to="/otk">
					OTK
				</v-tab>
			</v-tabs>
		</v-app-bar>

		<v-banner v-model="banner" single-line>
			{{ wsState }}
			<template v-slot:actions>
				<v-btn text @click="banner = false">close</v-btn>
			</template>
		</v-banner>

		<v-flex column v-show="!isStarted">
			<sql-text-area> </sql-text-area>

			<v-flex v-if="!isStarted" row wrap>
				<v-flex
					v-for="h in history"
					:key="h.text"
					:class="{
						'active-card-container': h.full,
						'card-container': !h.full
					}"
					:pa-2="!h.full"
					:pa-5="h.full"
				>
					<v-card
						:class="{
							'fill-height active-card  elevation-24 animated': h.full,
							'card fill-height': !h.full
						}"
						hover
						@click="cardClick(h)"
					>
						<v-layout column fill-height>
							<v-card-text>
								<v-flex
									full-width
									:class="{ sql: !h.full, 'active-card-text': h.full }"
									>{{ h.text.trim().toUpperCase() }}
								</v-flex>
							</v-card-text>
							<v-layout full-height column>
								<v-flex column full-height d-flex height="1000px"
									><div><v-spacer></v-spacer></div
								></v-flex>
							</v-layout>
							<v-layout align-content-end align-end column justify-end>
								<v-card-actions>
									<v-btn icon color="light-green">
										<v-icon @click.native="h.full = !h.full">mdi-more</v-icon>
									</v-btn>
								</v-card-actions>
							</v-layout>
						</v-layout>
					</v-card>
				</v-flex>
			</v-flex>
		</v-flex>
		<v-flex>
			<my-data-table
				v-if="isStarted"
				:showGroupBy="showGroupBy"
				:items="items"
				:headers="headers"
				:headers-edited="headersEdited"
				:all-headers="allHeaders"
			></my-data-table>
			<v-combobox
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
		</v-flex>
	</v-layout>
</template>
<script>
import * as ws from "socket.io-client";
import SqlTextArea from "./SqlTextArea.vue";
import MyDataTable from "./MyDataTable.vue";
export default {
	wsCli: undefined,
	name: "ExecuteTsql",
	components: { SqlTextArea, MyDataTable },
	data: () => ({
		PreferencesDialog: false,
		canDo_: false,
		showGroupBy: false,
		backendUrl: `ws://10.1.2.2:3002`,
		isStarted: false,
		banner: false,
		timerId: 0,
		tab: 0,
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
		totalInstances: 0
	}),
	computed: {
		dark: {
			get() {
				return this.$vuetify.theme.dark || true;
			},
			set(v) {
				this.$vuetify.theme.dark = v;
			}
		},
		canDo: {
			get() {
				if (this.canDo_) {return true}
				let pre_sql = window.Vue.$children.filter(e => {
					return e.sql !== undefined;
				})[0];
				console.log(pre_sql)
				if (pre_sql != undefined) {
					return (pre_sql.sql.length > 5 ? true : false)
				}
				return false
			},set(v){
				this.canDo_ = v;

			}


		}
	},
	beforeCreate() {
		window.Vue = this;
		window.wsCli = this.wsCli;
		this.$on("inputSQL", value => {
			this.wsState = value;
			this.updateCanDo();

			console.log(value);
		});
	},
	mounted() {
		this.$on("inputSQL", value => {
			this.wsState = value;
		});
		this.connect();
		this.wsCli.emit("history");
		this.wsCli.on("history", history => {
			this.history.push(history);
			this.history = this.history.flat().filter(e => {
				return e.text.length > 10;
			});
		});
	},
	methods: {
		updateCanDo(){
			let pre_sql = window.Vue.$children.filter(e => {
					return e.sql !== undefined;
				})[0];

				if (pre_sql != undefined) {
					this.canDo = (pre_sql.sql.length > 5 ? true : false)
				}
		},
		setClipboard(h) {
			window.navigator.clipboard.writeText(h);
		},
		async lazyText() {
			try {
				return window.Vue.find(a => {
					return a.$options._componentTag == "v-data-table";
				}).$data.internalGroupBy;
			} catch (e) {
				console.error(e);
			}
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
		cardClick(item) {
			this.sql = item.h;
			this.canDo = true;
			window.Vue.$children.filter(e => {
				return e.sql !== undefined;
			})[0].sql = item.text;
		},
		async submit() {
			var wsCli = this.wsCli;
			try {
				clearInterval(this.timerId);
			} catch (error) {}
			let sql = window.Vue.$children.filter(e => {
				return e.sql !== undefined;
			})[0].sql;
			this.wsState = sql;
			if (wsCli === undefined) {
				wsCli = ws.connect(this.backendUrl, {
					randomizationFactor: 0.1,
					reconnectionDelayMax: 700,
					reconnectionDelay: 80
				});
				this.isStarted = true;
			} else if (wsCli.connected || this.isDone) {
				this.isDone = false;
				this.isStarted = false;
				wsCli.disconnect();
				wsCli.removeAllListeners();
				return;
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
<style scoped>
.card {
}

.card-container {
	max-width: 400px;
}

.active-card-container {
	max-width: 1000px;

	max-height: max-content;
}

.active-card-text {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: pre;
	overflow-wrap: break-word;
	font-family: "Roboto mono", Consolas, "fira code", monospace;
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
		background-color: rgba(99, 99, 99, 1);
	}
	30% {
		background-color: rgba(100, 144, 144, 1);
	}
	50% {
		background-color: rgba(99, 111, 100, 1);
	}
	70% {
		background-color: rgba(99, 100, 144, 1);
	}
}
.animated {
	animation: anime infinite 7s !important;
}
.sql {
	font-family: "Roboto mono", Consolas, "fira code", monospace;

	white-space: pre;
	overflow: hidden;
	text-overflow: ellipsis;
	overflow-wrap: break-word;
}
</style>
