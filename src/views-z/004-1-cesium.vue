<template>
  <div class="c-0">
    <div class="title">Cesium demo</div>

    <div id="cesiumContainer"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { Viewer } from 'cesium'

// development 情况下：解决 vite.config.ts 中 base 路径非根目录时，找不要样式文件的问题
// produciton  情况下：无此问题
import '@/../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

export default defineComponent({
  name: 'CesiumDemo',

  setup() {
    onMounted(() => {
      // eslint-disable-next-line no-unused-vars
      const viewer = new Viewer('cesiumContainer')
    })
    return {}
  }
})
</script>

<style lang="scss" scoped>
#cesiumContainer {
  position: absolute;
  height: 100%;
  width: 100%;
}
</style>
