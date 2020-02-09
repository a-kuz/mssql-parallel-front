import Vue from "vue";
import Router from "vue-router";
import DevInterface from "./views/Dev.vue";
import Simple from "./views/Simple.vue";
import SimpleDev from "./views/SimpleDev.vue";

Vue.use(Router);

export default new Router({
	routes: [
		{
			path: "/otk",
			name: "otk",

			component: Simple
		},
		{
			path: "/dev",
			name: "dev",
			component: DevInterface
		},
		{
			path: "/",
		  redirect:"/dev"

		}
		,
		{
			path: "/2",
		  name: "otkdev",
		  component:SimpleDev

		}
	]
});
