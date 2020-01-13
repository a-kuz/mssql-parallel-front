<template>
	<v-container>
		<v-layout column>
			<v-layout row>
				<v-flex xs12 fill-height>
					<v-form target="blank_">
						<v-textarea
							class="mainTextArea"
							tabindex="1"
							outlined
							auto-grow
							autofocus
							v-model="sql"
							hint="Paste your T-SQL query => Push GO => Your query will executes on 250 instances!"
							label="your SQL"
							@input="input"
						></v-textarea>
					</v-form>
				</v-flex>
			</v-layout>
		</v-layout>
		<v-layout row wrap> </v-layout>
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
div .v-card {transition-duration: 1s }
.mainTextArea {transition-duration: 1s}
</style>
