s<template>
  <v-container>
    <v-layout column>
      <v-layout row>
        <v-flex xs12 fill-height>
          <v-form target="blank_">
            <v-textarea
            outlined
              auto-grow
              autofocus
              hint="Paste your T-SQL query => Push GO => Your query will executes on 233 instances!"
              
              
              label="your SQL"
              v-model="sql"
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

  mounted: {},
  methods: {
    submit() {
      console.log(sql)          
    }
  }
};
</script>
`