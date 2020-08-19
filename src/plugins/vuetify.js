// "use strict";
// exports.__esModule = true;
// var vue_1 = require("vue");
// var lib_1 = require("vuetify/lib");
// vue_1["default"].use(lib_1["default"]);
// exports["default"] = new lib_1["default"]({
// 	icons: {
// 		iconfont: "mdi"
// 	},
// 	theme: { dark: true }
// });

// src/plugins/vuetify.js

import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader
import Vue from 'vue'
import Vuetify from 'vuetify/lib'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi', // default - only for display purposes
  },
})