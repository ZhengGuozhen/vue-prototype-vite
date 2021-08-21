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
import * as ContextMenuData from './provide/contextMenu.js'
import ContextMenu from './ui/ContextMenu.vue'
import * as FilterData from './provide/filter.js'
import Filter from './ui/Filter.vue'

const rootContainer = ref(null)
let tsInstance = null
let tsInstanceOk = ref(false)

const contextMenuCommon = reactive(ContextMenuData.contextMenuCommon)
provide('contextMenuCommon', contextMenuCommon)

const filterBaseObject = reactive(FilterData.filterBaseObject)
provide('filterBaseObject', filterBaseObject)

onMounted(() => {
    const el = rootContainer.value
    tsInstance = new Demo(el)
    global.tsInstance = tsInstance
    tsInstanceOk.value = true

    tsInstance.world.addScreenSpaceEventHandler((e) => {
        onWorldClickLeft(e)
    }, tsInstance.world.ScreenSpaceEventType.LEFT_CLICK)

    tsInstance.world.addScreenSpaceEventHandler((e) => {
        onWorldClickRight(e)
    }, tsInstance.world.ScreenSpaceEventType.RIGHT_CLICK)
})

onUnmounted(() => {
    tsInstance.dispose()
})

const onWorldClickLeft = (e) => {
    hideContextMenu()
}

const onWorldClickRight = (e) => {
    showContextMenu(e.position)
}

function showContextMenu(position) {
    let r1 = tsInstance.baseObjectHub.pick(position.x, position.y)
    let r2 = tsInstance.baseObjectHub.pick2(position.x, position.y)
    let all = [...r1, ...r2]

    contextMenuCommon.show = true
    contextMenuCommon.position = { x: position.x, y: position.y }

    if (all.length > 0) {
        contextMenuCommon.intersectObject = all[0]
        contextMenuCommon.options = ContextMenuData.optionsBaseObject
    } else {
        contextMenuCommon.intersectObject = tsInstance
        contextMenuCommon.options = ContextMenuData.optionsWorld
    }
}
function hideContextMenu() {
    contextMenuCommon.show = false
}
</script>

<template>
    <div class="w-h-screen overflow-hidden">
        <div ref="rootContainer" class="absolute w-h-screen"></div>

        <!-- 公用组件，动态数据 -->
        <ContextMenu :style="{ zIndex: 9999 }" />
        <!-- 独立组件，专用数据 -->
        <Filter v-if="tsInstanceOk" data="filterBaseObject" :style="{ zIndex: 9999 }" />

        <!-- test -->
        <div class="absolute bottom-0 flex text-white cursor-pointer">
            <div class="border-d" @click="filterBaseObject.show = !filterBaseObject.show">FilterBaseObject</div>
        </div>
    </div>
</template>

<style lang="scss">
.cesium-widget-credits {
    display: none !important;
}
</style>
