<template>
  <div class="w-h-screen">
    <div ref="rootContainer" class="absolute w-h-screen overflow-hidden"></div>

    <div class="absolute top-10 border-d flex">
      <div class="m-2 border-d cursor-pointer" @click="test.f1">remove/restore</div>
      <div class="m-2 border-d cursor-pointer" @click="test.f2">tip显隐</div>
      <div class="m-2 border-d cursor-pointer" @click="test.f3">3d/2d</div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue'

// development 情况下：解决 vite.config.ts 中 base 路径非根目录时，找不要样式文件的问题
// produciton  情况下：无此问题
import '@/../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

import Demo from './examples/Demo.js'

export default defineComponent({
  name: 'CesiumDemo',

  setup() {
    const rootContainer = ref(null)
    let zts = null

    onMounted(() => {
      const el = rootContainer.value
      zts = new Demo(el)
    })

    let test = {
      f1: (e) => {
        if (e.target.__state === undefined) {
          e.target.__state = true
        }

        if (!e.target.__state) {
          e.target.__state = true
          zts.BaseObject.restoreAll()
        } else {
          e.target.__state = false
          zts.BaseObject.removeAll()
        }

        zts.world.timerRender()
      },
      f2: (e) => {
        if (e.target.__state === undefined) {
          e.target.__state = true
        }

        if (!e.target.__state) {
          e.target.__state = true
          zts.BaseObject.restoreCssTipAll()
        } else {
          e.target.__state = false
          zts.BaseObject.removeCssTipAll()
        }

        zts.world.timerRender()
      },
      f3: (e) => {
        zts.world.changeView('3d')
      }
    }

    return { rootContainer, test }
  }
})
</script>

<style lang="scss">
.cesium-widget-credits {
  display: none !important;
}
</style>
