<template>
  <v-container>
    <v-layout column>
      <v-layout row >
        <v-flex xs12 dark>
          <v-img 
           v-if="!isStarted"
          :src="require('./logo-sql.png')"
          class="my-3"
          contain
          height="200"
          ></v-img>
        </v-flex>
        <v-flex xs12 fill-height>
          <v-form target="blank_">
            <v-text-field  v-if="!isStarted" :height="200" multi-line label="your SQL" v-model="sql"></v-text-field>
            <v-btn @click="submit">
              {{this.isStarted ? "STOP" : "GO"
              }}
            </v-btn>
          </v-form>
        </v-flex>
      </v-layout>
      <v-flex>
        <v-data-table
          v-if="isStarted"       
          :headers="headers"
          :items="items"
          multi-sort
          selection
          calculate-widths
          hide-default-footer
                             :footer-props="footerProps"
          :disablePagination="true"
          item-key="id"
          ></v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import * as ws from "socket.io-client";
import { writeFile, appendFile } from "fs";
const HISTORY_PATH = "./sql_history.log";
export default {
  name: "ExecuteTsql",
  data: () => ({
    isStarted:false,
    wsCli: undefined,
    footerProps:{'disable-pagination':true,'disable-items-per-page':true},
    sql: "",
    items: [],
    headers: []
  }),
  methods: {
    submit() {
           //appendFile(HISTORY_PATH, this.sql, (err) => {console.log(err)}).then(appendFile(HISTORY_PATH, 3,(err) => {console.log(err)}))
      var cli = this.wsCli;
      if (this.wsCli === undefined) {
        this.wsCli = ws.connect("ws://10.1.2.2:3002");
        cli = this.wsCli;
        this.isStarted = true;
      } else if (cli.connected) {
        cli.disconnect();
        this.isStarted = false;
        cli.removeListener("message");
        this.items =[];
        this.headers=[]

        return;
      } else {
        this.items =[];
        this.headers=[]
        this.wsCli = ws.connect("ws://10.1.2.2:3002");
        cli = this.wsCli;
        this.isStarted = true;
      }
      cli.send(this.sql);

      // eslint-disable-next-line no-console,no-control-regex
      cli.on("message", ev => {
        this.items.push(ev);

        if (this.headers.length == 0) {
          Object.keys(ev).forEach(e => {
            let h = { text: e, value: e };
            if (e!=='id') {
            this.headers.push(h);}
          });
        }
      });
    }
  }
};
</script>
