<template>
  <div class="c-0">
    <div class="title">Cesium demo</div>

    <div id="cesiumContainer"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { Viewer } from 'cesium'

export default defineComponent({
  name: 'cesium demo',

  setup() {
    onMounted(() => {
      // eslint-disable-next-line no-unused-vars
      const viewer = new Viewer('cesiumContainer')
    })
    return {}
  }
})
</script>

<style lang="scss">
#cesiumContainer {
  position: absolute;
  height: 100%;
  width: 100%;
}
</style>
