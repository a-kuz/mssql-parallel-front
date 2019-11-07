<template>
  <v-app>
    <v-app-bar app mini-variant>
      <div class="d-flex align-center"></div>

      <v-spacer></v-spacer>

      <v-btn
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
        target="_blank"
        text
      >
        <span class="mr-2">Выполнение SQL на всех ТТ</span>
        <v-icon>mdi-database</v-icon>
      </v-btn>
    </v-app-bar>

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
