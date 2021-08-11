<template>
  <div class="w-h-screen">
    <div
      id="rootContainer"
      ref="rootContainer"
      class="absolute w-h-screen overflow-hidden"
    ></div>
    <div class="absolute border-d flex">
      <div class="m-2 border-d" @click="func_1">tip显隐藏</div>
      <div class="m-2 border-d" @click="func_2">3d/2d</div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue'

// development 情况下：解决 vite.config.ts 中 base 路径非根目录时，找不要样式文件的问题
// produciton  情况下：无此问题
import '@/../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

import World from './core/world.js'

export default defineComponent({
  name: 'CesiumDemo',

  setup() {
    const rootContainer = ref(null)

    onMounted(() => {
      const el = rootContainer.value
      const world = World.getInstance()
      world.init(el)
      world.addTestObjects()
    })

    function func_1(e) {
      if (!e.target.__state) {
        e.target.__state = true
        World.getInstance().restoreTipAll()
      } else {
        e.target.__state = false
        World.getInstance().removeTipAll()
      }
    }

    function func_2(e) {
      World.getInstance().changeView('3d')
    }

    return { rootContainer, func_1, func_2 }
  }
})
</script>

<style lang="scss" scoped>
//
</style>
