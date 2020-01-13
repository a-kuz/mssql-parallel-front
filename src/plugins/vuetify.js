"use strict";
exports.__esModule = true;
var vue_1 = require("vue");
var lib_1 = require("vuetify/lib");
vue_1["default"].use(lib_1["default"]);
exports["default"] = new lib_1["default"]({
	icons: {
		iconfont: "mdi"
	},
	theme: { dark: true }
});
