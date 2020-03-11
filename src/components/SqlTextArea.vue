<template>
	<v-container>
		<v-layout column >
			<v-layout row >
				<v-flex xs12 fill-height >
					<v-form target="blank_">

						<v-textarea
solo
							promary
							v-model="sql"
							class="mainTextArea"
							tabindex="1"

							auto-grow
							autofocus
							hint="Paste your T-SQL query => Push GO => Your query will executes on 250 instances!"
							label="your SQL"
							persistent-hint
							@input="input"
						></v-textarea>
					</v-form>
				</v-flex>
			</v-layout>
		</v-layout>
	</v-container>
</template>

<script>
export default {
	name: "SqlTextArea",
	data: () => ({
		sql: ""
	}),
	created: () => {},
	methods: {
		input() {
			this.$parent.$emit("inputSQL", this.sql);
		}
	}
};
</script>

<style lang="css">
div .v-card {
	transition-duration: 1s;
}
.mainTextArea {
	transition-duration: 1s;
	font-family: consolas, monospace;
	text-emphasis: f;



}
</style>
