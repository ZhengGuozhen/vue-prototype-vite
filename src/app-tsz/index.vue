<template>
  <div class="w-h-screen">
    <div
      ref="rootContainer"
      class="absolute w-h-screen overflow-hidden"
      @click="onRootContainerClick"
    ></div>

    <!-- contextMenuData -->
    <div
      class="absolute border-d flex text-white"
      :style="{
        display: contextMenuData.show ? 'block' : 'none',
        left: contextMenuData.position.x + 'px',
        top: contextMenuData.position.y + 'px'
      }"
      @click="contextMenuData.show = false"
    >
      <div
        v-for="(item, index) of contextMenuData.options"
        :key="index"
        class="border-d bg-gray-500 cursor-pointer"
        @click="item.action(contextMenuData.intersectObject)"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onUnmounted, reactive, ref } from 'vue'

// development 情况下：解决 vite.config.ts 中 base 路径非根目录时，找不到样式文件的问题
// produciton  情况下：无此问题
import '@/../node_modules/cesium/Build/Cesium/Widgets/widgets.css'

import Demo from './examples/Demo.js'

export default defineComponent({
  name: 'CesiumDemo',

  setup() {
    const rootContainer = ref(null)

    const contextMenuData = reactive({
      show: false,
      intersectObject: null,
      position: {},
      options: []
    })
    const contextMenuOptions_World = [
      {
        label: '3D/2D',
        action: (o) => {
          o.world.changeView()
        }
      },
      {
        label: '移除所有Tip',
        action: (o) => {
          o.BaseObjectHub.removeCssTipAll()
        }
      },
      {
        label: '恢复所有Tip',
        action: (o) => {
          o.BaseObjectHub.restoreCssTipAll()
        }
      },
      {
        label: '移除所有Object',
        action: (o) => {
          o.BaseObjectHub.removeAll()
        }
      },
      {
        label: '恢复所有Object',
        action: (o) => {
          o.BaseObjectHub.restoreAll()
        }
      }
    ]
    const contextMenuOptions_BaseObject = [
      {
        label: 'Tip显隐',
        action: (o) => {
          if (o.tip) {
            o.toggleCssTip()
          }
        }
      },
      {
        label: '移除',
        action: (o) => {
          o.remove()
        }
      }
    ]

    let tsz = null

    onMounted(() => {
      const el = rootContainer.value
      tsz = new Demo(el)

      tsz.world.addScreenSpaceEventHandler((e) => {
        onWorldClickLeft(e)
      }, tsz.world.ScreenSpaceEventType.LEFT_CLICK)

      tsz.world.addScreenSpaceEventHandler((e) => {
        onWorldClickRight(e)
      }, tsz.world.ScreenSpaceEventType.RIGHT_CLICK)
    })

    onUnmounted(() => {
      tsz.dispose()
    })

    const onWorldClickLeft = (e) => {
      contextMenuData.show = false
    }

    const onWorldClickRight = (e) => {
      let r1 = tsz.BaseObjectHub.pick(e.position.x, e.position.y)
      let r2 = tsz.TrackObjectHub.pick(e.position.x, e.position.y)
      let r3 = tsz.EventObjectHub.pick(e.position.x, e.position.y)

      if (r1.length > 0) {
        contextMenuData.show = true
        contextMenuData.intersectObject = r1[0]
        contextMenuData.position = { x: e.position.x, y: e.position.y }
        contextMenuData.options = contextMenuOptions_BaseObject
        return
      }

      if (r2.length > 0) {
        return
      }

      if (r3.length > 0) {
        return
      }

      contextMenuData.show = true
      contextMenuData.intersectObject = tsz
      contextMenuData.position = { x: e.position.x, y: e.position.y }
      contextMenuData.options = contextMenuOptions_World
    }

    const onRootContainerClick = (e) => {
      // let o = tsz.BaseObjectHub.pick(e.clientX, e.clientY)
    }

    return { rootContainer, contextMenuData, onRootContainerClick }
  }
})
</script>

<style lang="scss">
.cesium-widget-credits {
  display: none !important;
}
</style>
