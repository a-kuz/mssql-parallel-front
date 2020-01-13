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
			<v-btn
				icon
				:loading="isDone != true && isStarted"
				:color="isDone ? 'primary' : 'white'"
				@click="submit"
			>
				<v-icon color="green">mdi-play</v-icon>
				{{ this.isDone ? "NEW" : this.isStarted ? "STOP" : "GO" }}
			</v-btn>
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
		</v-app-bar>
		<v-banner v-model="banner" single-line>
			{{ wsState }}
			<template v-slot:actions>
				<v-btn text @click="banner = false">close</v-btn>
			</template>
		</v-banner>
		<v-flex column>
			<sql-text-area v-show="!isStarted"></sql-text-area>

			<v-flex v-if="!isStarted" full-width row wrap>
				<v-flex
					v-for="h in history"
					:key="h.text"
					d-flex
					pa-2
					:xs3="!h.full"
					:xs6="h.full"
					full-width
				>
					<v-card
						:class="{
							'outlined elevation-24 animated': h.full,
							'flat tile': !h.full
						}"
						hover
						@click="cardClick(h)"
					>
						<v-card-text>
							<v-flex column full-width>
								<span
									v-for="(t, i) in h.text.split(String.fromCharCode(10))"
									:key="i"
									class="cls"
								>
									<span v-if="i <= 11 || h.full">
										{{ t.toUpperCase() }}

										<v-flex
											v-if="
												(i == 11 && !h.full) ||
													(h.full &&
														i ==
															h.text.split(String.fromCharCode(10)).length - 1)
											"
											class="cls2"
											d-inline-block
											flex-column
											reverse
											flex-end
											absolute
										>
											<v-badge absolute>
												<v-btn icon color="light-green">
													<v-icon @click.native="h.full = !h.full"
														>mdi-more</v-icon
													>
												</v-btn>
											</v-badge>
										</v-flex>
										<br />
									</span>
								</span>
							</v-flex>
						</v-card-text>
					</v-card>
				</v-flex>
			</v-flex>
		</v-flex>

		<v-flex>
			<v-data-table
				v-if="isStarted"
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
	</v-container>
</template>
<script>
import * as ws from "socket.io-client";
import SqlTextArea from "./SqlTextArea.vue";

export default {
	wsCli: undefined,
	name: "ExecuteTsql",
	components: { SqlTextArea },

	data: () => ({
		isStarted: false,
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
		totalInstances: 0
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
		this.wsCli.emit("history");
		this.wsCli.on("history", history => {
			this.history.push(history);
			this.history = this.history.flat().filter(e => {
				return e.text.length > 10;
			});
		});
	},
	methods: {
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
			this.wsCli = ws.connect("ws://10.1.2.2:3002", {
				randomizationFactor: 0.1,
				reconnectionDelayMax: 700,
				reconnectionDelay: 80
			});
		},
		cardClick(item) {
			this.sql = item.h;
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
				wsCli = ws.connect("ws://10.1.2.2:3002", {
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
</style>
