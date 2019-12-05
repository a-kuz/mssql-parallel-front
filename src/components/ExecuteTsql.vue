@ts-check
<template>
  <v-container light:>
    <v-navigation-drawer clipped  app v-model="drawer">
        <v-list-item-avatar><v-icon>mdi-table</v-icon> </v-list-item-avatar>
        <v-list-item>
          <v-list-item-content>
            <v-checkbox
              dense
              label="small"
              v-model="denseTable"
              hide-details
            ></v-checkbox>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
          <v-checkbox
            dense
          append-icon="undefined -> String"
            label="started"
            v-model="isStarted"
            hide-details
          ></v-checkbox>
          </v-list-item-content>
        </v-list-item>
        <div style="height:70%"></div>
        <v-layout column style="align-items:flex-end" align-content-end justify-end >
          <v-spacer></v-spacer>
        <v-flex style="align-items:flex-end">
<v-list-item-group>
        <v-list-item>
          <v-list-item-content>
          <v-checkbox
            dense
            label="dark"
            v-model="dark"
            hide-details
          ></v-checkbox>
          </v-list-item-content>
        </v-list-item>
        </v-list-item-group>
      </v-flex>
      </v-layout>
    </v-navigation-drawer>
    <v-app-bar app fixed clipped-left :dense="denseTable">
      <v-app-bar-nav-icon @click="appNavClick"></v-app-bar-nav-icon>
      <v-btn
        icon
        :loading="isDone != true && isStarted"
        @click="submit"
        :color="isDone ? 'primary' : 'white'"
      >
        <v-icon color="green">mdi-play</v-icon>
        {{ this.isDone ? "NEW" : this.isStarted ? "STOP" : "GO" }}
      </v-btn>
      <v-progress-linear
        :active="isDone != true && isStarted"
        :normalizedBuffer="totalInstances"
        color="primary"       
        v-bind="progress"
        height="40"
      > {{Math.round(progress.value) + " / " + totalInstances}}
</v-progress-linear>
      <v-spacer></v-spacer>
      <v-layout md2 align-end justify-end="">
        <span>Выполнение SQL на всех ТТ</span>
        <v-icon>mdi-database</v-icon>
      </v-layout>
    </v-app-bar>
     <v-banner single-line v-model="banner" >
    {{wsState}}
    <template v-slot:actions>
      <v-btn
        text
        @click="banner=false"
      >
        close
      </v-btn>
    </template>
  </v-banner>
    <v-layout column>
      <v-layout row>
        <v-flex xs12 dark>
          <v-img
            v-if="!isStarted"
            :src="require('.\\logo-sql.png')"
            class="my-3"
            contain
            height="100"
          ></v-img>
        </v-flex>
        <sql-text-area v-show="!isStarted"></sql-text-area>
      </v-layout>
      <v-flex>
        
        <v-data-table
          show-group-by
          :group-by="groupBy"
          v-if="isStarted"
          :dense="denseTable"
          :headers="headers"
          :items="items"
          multi-sort
          selection
          calculate-widths
          :footer-props="footerProps"
          :items-per-page="100"
          :disablePagination="false"
          item-key="id"
        ></v-data-table>
        <v-combobox
         v-if="isStarted"
          v-model="headersEdited"
          @click:clear="resetHeaders"
          chips
          clearable
          multiple
          prepend-icon="mdi-view-week"
          solo          
        >
          <template v-slot:selection="{ attrs, item, select, selected }">
            <v-chip
              :input-value="selected"
              close
              @click.native="removeHead(item)"
              @click:close="removeHead(item)"
            >
              {{ item.text }}
            </v-chip>
          </template>
        </v-combobox>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import * as ws from "socket.io-client"
import SqlTextArea from "./SqlTextArea.vue"

export default {
  wsCli: undefined,
  name: "ExecuteTsql",

  data: () => ({
    isStarted: false,
    banner: true,
    wsState: "not started",
    footerProps: {
      "disable-pagination": false,
      "disable-items-per-page": false,
      itemsPerPageOptions: [100, 10, 50, 200, 0, 999999, "All"]
    },
    denseTable: true,
    items: [],
    headers: [],
    allHeaders: [],
    headersEdited: [],
    isDone: false,
    drawer: true,
    groupBy: [],
    progress: { bufferValue: 0, value: 0 },
    totalInstances: 0
  }),
  computed: {
    dark: {
      get() {
        return this.$vuetify.theme.dark
      },
      set(v) {
        this.$vuetify.theme.dark = v
      }
    }
  },
  beforeCreate(pVue) {
    window.Vue = this
    window.wsCli = this.wsCli
    this.$on("inputSQL", value => {
      this.wsState = value
    })
  },

  mounted() {
    this.$on("inputSQL", value => {
      this.wsState = value
    })
  },
  components: { SqlTextArea },
  methods: {
    async lazyText() {
      try {
        return window.Vue.find(a => {
          return a.$options._componentTag == "v-data-table"
        }).$data.internalGroupBy
      } catch {}
    },
    appNavClick() {
      this.drawer = !this.drawer
      globalThis.Vue = this
    },
    removeHead(item) {
      this.headersEdited = this.headersEdited.filter(e => e.text !== item.text)
      this.headers = this.headers.filter(e => e.text !== item.text)
    },
    resetHeaders() {
      this.headersEdited = this.allHeaders
      this.headers = this.allHeaders
    },
    select(item) {
      console.log(item)
    },
    submit() {
      let sql = window.Vue.$children.filter(e => {
        return e.sql !== undefined
      })[0].sql
      if (wsCli === undefined) {
        wsCli = ws.connect("ws://10.1.2.2:3002", {
          randomizationFactor: 0.1,
          reconnectionDelayMax: 700,
          reconnectionDelay: 80
        })

        this.isStarted = true
      } else if (wsCli.connected || this.isDone) {
        this.isDone = false
        this.isStarted = false
        wsCli.disconnect()
        wsCli.removeAllListeners()

        return
      } else {
        this.items = []
        this.headers = []
        this.allHeaders = []
        this.headersEdited = []
        wsCli = ws.connect("ws://10.1.2.2:3002")
        this.isStarted = true
        this.isDone = false
      }
      wsCli.send(sql)
      wsCli.on("end", ev => {
        this.isDone = true
      })
      wsCli.on("error", err => {
        console.error(err)
        alert(err)
      })
      wsCli.on("progress", async progressData => {
        this.progress = progressData
        this.wsState = wsCli.bufferValue
      })
      wsCli.on("start", startData => {
        //window.alert(JSON.stringify(startData))
        this.totalInstances = startData.totalInstances
      })
      wsCli.on("message", async objcts => {
        objcts.forEach(ev => {
          if (Object.keys(ev).length > 2) {
            this.items.push(ev)
            if (this.headers.length == 0) {
              Object.keys(ev).forEach(e => {
                let h = { text: e, value: e, selected: false }
                if (e !== "id") {
                  this.headers.push(h)
                  this.allHeaders.push(h)
                  this.headersEdited.push(h)
                }
              })
            }
          }
        })
      })
    }
  }
}
</script>
