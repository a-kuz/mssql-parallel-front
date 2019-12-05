<template>
  <v-container>
    <v-navigation-drawer clipped fixed app v-model="drawer">
      <v-list-item-group>
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
          <v-checkbox
            dense
            label="started"
            v-model="isStarted"
            hide-details
          ></v-checkbox>
        </v-list-item>
      </v-list-item-group>
      <v-list-item>
        <v-text-field :v-text="lazyText()" textarea></v-text-field>
      </v-list-item>
    </v-navigation-drawer>
    <v-app-bar app fixed clipped-left :dense="denseTable">
      <v-app-bar-nav-icon @click="appNavClick"></v-app-bar-nav-icon>
      <v-btn icon :loading="(isDone != true) && (isStarted)" @click="submit" :color="isDone ? 'primary' : 'white'">
        <v-icon color="green">mdi-play</v-icon>
        {{ this.isDone ? "NEW" : this.isStarted ? "STOP" : "GO" }}
      </v-btn>

      
      

      <v-spacer></v-spacer>
      <v-layout md2 align-end justify-end="">
        <span>Выполнение SQL на всех ТТ</span>
        <v-icon>mdi-database</v-icon>
      </v-layout>
    </v-app-bar>

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
        <v-combobox
          v-model="headersEdited"
          vbox
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
            @click.native = "removeHead(item)"
              @click:close="removeHead"

            >
              <strong>{{ item.text }}</strong>
              
            </v-chip>
          </template>
        </v-combobox>
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
          :items-per-page=100
          :disablePagination="false"
          item-key="id"
        ></v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import * as ws from "socket.io-client";
import SqlTextArea from "./SqlTextArea.vue";

const HISTORY_PATH = "sql_history.log";
export default {
  name: "ExecuteTsql",
  data: () => ({
    isStarted: false,
    wsCli: undefined,
    footerProps: { "disable-pagination": false, "disable-items-per-page": false,itemsPerPageOptions:[100,10,50,200] },
    
    denseTable: false,
    items: [],
    headers: [],
    allHeaders: [],
    headersEdited:[],

    isDone: false,
    drawer: false,
    groupBy: []
  }),
    mounted() {
      window.Vue = this;

    this.$on("submit", this.submit);
  },
  components: { SqlTextArea },
  methods: {
    async lazyText() {
      try {
      return window.Vue.find(a => {
        return a.$options._componentTag == "v-data-table";
      }).$data.internalGroupBy;
      } catch {}
    },

    appNavClick() {
      this.drawer = !this.drawer;
      globalThis.Vue = this;
    },
    removeHead(item) {
      console.log("item:"+item)
      console.log("this.headersEdited: " + this.headersEdited)
      console.log("this.headers: " + this.headers)
      this.headersEdited = this.headersEdited.filter(e =>e.text !== item.text);
      this.headers = this.headers.filter(e =>e.text !== item.text);
    },
    select(item) {console.log(item)},
    submit() {
      let sql =""      
      sql = window.Vue.$children.filter(e=>{return e.sql !== undefined})[0].sql      
      
      
     
      var cli = this.wsCli;
      if (this.wsCli === undefined) {
        this.wsCli = ws.connect("ws://10.1.2.2:3002");
        cli = this.wsCli;
        this.isStarted = true;
      } else if ((cli.connected)||(this.isDone)) {
        this.isDone = false;
        this.isStarted = false;
        cli.disconnect();        
        cli.removeListener("message");
        this.items = [];
        this.headers = [];
        this.allHeaders = [];
        this.headersEdited = [];
        

        return;
      } else {
        this.items = [];
        this.headers = [];
        this.allHeaders = [];
        this.headersEdited = [];
        this.wsCli = ws.connect("ws://10.1.2.2:3002");
        cli = this.wsCli;
        this.isStarted = true;
        this.isDone = false;
      }
      
      cli.send(sql);      
      // eslint-disable-next-line no-console,no-control-regex
      cli.on("end", ev => {
        this.isDone = true;
      });

      cli.on("message", ev => {

        if (Object.keys(ev).length > 2) {
          this.items.push(ev);
        }
        if (this.headers.length == 0) {
          if (Object.keys(ev).length > 2) {
            Object.keys(ev).forEach(e => {
              let h = { text: e, value: e, selected: false };
              if (e !== "id") {
                this.headers.push(h);
                this.allHeaders.push(h);
                
                this.headersEdited.push(h)

              }
            });
          }
        }
      });
    }
  }
};
</script>
