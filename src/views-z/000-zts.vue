<template>
  <zts class="w-h-screen"></zts>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import zts from '../app-zts/index.vue'

export default defineComponent({
  name: 'Home',
  components: {zts},
})
</script>
