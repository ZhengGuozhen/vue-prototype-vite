<script setup>
import { onMounted, onUnmounted, defineProps, inject, ref } from 'vue'
import { jsPlumb } from 'jsplumb'
import { global } from '../global.js'

const mainDom = ref(null)
const plumbIns = jsPlumb.getInstance()

const props = defineProps({
    data: String,
})

const data = inject(props.data)

onMounted(() => {
    console.warn('onMounted Filter')
    plumbIns.draggable(mainDom.value)

    initData()
})

onUnmounted(() => {})

function initData() {
    data.options = []

    let hub = global.tsInstance[data.hub]

    let fields = data.fields

    fields.forEach((field) => {
        let set = new Set()
        hub.getObjectAll().forEach((o) => {
            set.add(o.__data[field])
        })

        let items = []
        set.forEach((v) => {
            items.push({
                label: v,
                value: v,
                checked: true,
            })
        })

        data.options.push({
            type: 'category',
            label: field,
            value: field,
            children: items,
        })
    })
}

function doFilter(groupIndex, itemIndex) {
    let group = data.options[groupIndex]
    let item = data.options[groupIndex].children[itemIndex]
    let checked = data.options[groupIndex].children[itemIndex].checked
    data.options[groupIndex].children[itemIndex].checked = !checked

    console.log('doFilter', group.value, item.value, item.checked)

    // do filter operation
    let hub = global.tsInstance[data.hub]
    hub.getObjectAll().forEach((o) => {
        if (o.__data[group.value] === item.value) {
            if (item.checked) {
                o.restore()
            } else {
                o.remove()
            }
        }
    })

    global.tsInstance.world.timerRender()
}
</script>

<template>
    <div
        ref="mainDom"
        class="absolute max-h-full border-2 border-red-400 bg-gray-500 text-white text-center"
        :style="{
            display: data.show ? 'block' : 'none',
        }"
    >
        <div
            v-for="(group, groupIndex) of data.options"
            :key="group.value"
            class="m-2 p-2 grid grid-cols-1 gap-2 bg-gray-700"
        >
            <div class="grid grid-cols-6 gap-2">
                <div class="px-1">{{ group.label }}</div>
                <div></div>
                <div></div>
                <div></div>
                <div class="px-1 bg-blue-700 cursor-pointer">全选</div>
                <div class="px-1 bg-blue-700 cursor-pointer">全不选</div>
            </div>
            <div class="grid grid-cols-4 gap-2">
                <div
                    v-for="(item, itemIndex) of group.children"
                    :key="item.value"
                    class="px-1 cursor-pointer"
                    :style="{
                        background: item.checked ? 'darkred' : 'grey',
                    }"
                >
                    <div @click="doFilter(groupIndex, itemIndex)">
                        {{ item.label }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
