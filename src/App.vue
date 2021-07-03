<template>
  <Main />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Main from '@/components/Main.vue'

export default defineComponent({
  name: 'App',
  components: {
    Main
  }
})
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html {
  height: 100%;
  width: 100%;
}
body {
  height: 100%;
  width: 100%;
}
</style>
