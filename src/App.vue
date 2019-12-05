<template>
  <v-app>
   

    <v-content>
      <ExecuteTsql />
    </v-content>
  </v-app>
</template>

<script>
import ExecuteTsql from "./components/ExecuteTsql.vue";

export default {
  name: "App",
  components: { ExecuteTsql },

  data: () => ({
    //
  })
};
</script>
,
