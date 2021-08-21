<script setup>
import { onMounted, onUnmounted, inject } from 'vue'

// 当使用响应式提供/注入值时，建议尽可能，在提供者内保持响应式 property 的任何更改
const data = inject('contextMenuData')

onMounted(() => {
    console.warn('onMounted ContextMenu')
})

onUnmounted(() => {})
</script>

<template>
    <div
        class="absolute flex border-2 border-red-400 bg-gray-500 text-white"
        :style="{
            display: data.show ? 'block' : 'none',
            left: data.position.x + 'px',
            top: data.position.y + 'px',
        }"
        @click="data.show = false"
    >
        <div
            v-for="(item, index) of data.options"
            :key="index"
            class="m-1 px-2 bg-gray-700 text-center cursor-pointer"
            @click="item.action(data.intersectObject)"
        >
            {{ item.label }}
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
