<script>
export default {
    name: 'TSZ',
}
</script>
<script setup>
// development 情况下：解决 vite.config.ts 中 base 路径非根目录时，找不到样式文件的问题
// produciton  情况下：无此问题
import '@/../node_modules/cesium/Build/Cesium/Widgets/widgets.css'
import { onMounted, onUnmounted, reactive, ref, provide } from 'vue'

// global
import { global } from './global.js'
// lib
import Demo from './lib/examples/Demo.js'
// 组件 & provide
import * as ContextMenuData from './provide/contextmenu.js'
import ContextMenu from './ui/ContextMenu.vue'

const rootContainer = ref(null)
let tsz = null

// const contextMenuData = contextMenuWorld
const contextMenuData = reactive(ContextMenuData.main)
provide('contextMenuData', contextMenuData)

onMounted(() => {
    const el = rootContainer.value
    tsz = new Demo(el)

    tsz.world.addScreenSpaceEventHandler((e) => {
        onWorldClickLeft(e)
    }, tsz.world.ScreenSpaceEventType.LEFT_CLICK)

    tsz.world.addScreenSpaceEventHandler((e) => {
        onWorldClickRight(e)
    }, tsz.world.ScreenSpaceEventType.RIGHT_CLICK)

    global.tsz = tsz
})

onUnmounted(() => {
    tsz.dispose()
})

const onWorldClickLeft = (e) => {
    hideContextMenu()
}

const onWorldClickRight = (e) => {
    showContextMenu(e.position)
}

function showContextMenu(position) {
    let r1 = tsz.baseObjectHub.pick(position.x, position.y)
    let r2 = tsz.baseObjectHub.pick2(position.x, position.y)
    let all = [...r1, ...r2]

    contextMenuData.show = true
    contextMenuData.position = { x: position.x, y: position.y }

    if (all.length > 0) {
        contextMenuData.intersectObject = all[0]
        contextMenuData.options = ContextMenuData.optionsBaseObject
    } else {
        contextMenuData.intersectObject = tsz
        contextMenuData.options = ContextMenuData.optionsWorld
    }
}
function hideContextMenu() {
    contextMenuData.show = false
}
</script>

<template>
    <div class="w-h-screen">
        <div ref="rootContainer" class="absolute w-h-screen overflow-hidden"></div>

        <ContextMenu :style="{ zIndex: 9999 }" />
    </div>
</template>

<style lang="scss">
.cesium-widget-credits {
    display: none !important;
}
</style>
