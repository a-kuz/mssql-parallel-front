<template>
	<v-content>
		<ExecuteTsql />
	</v-content>
</template>

<script>
import ExecuteTsql from "../components/ExecuteTsql";

export default {
	name: "App",
	components: { ExecuteTsql },

	data: () => ({
		//
	})
};
</script>
