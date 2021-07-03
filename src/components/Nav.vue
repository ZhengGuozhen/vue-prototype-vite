<template>
  <div class="nav">
    <div
      class="nav-item flex-center"
      v-for="(nav, index) in navList"
      :key="index"
      :class="{ active: nav.isActive }"
      @click="navClick(nav)"
    >
      {{ nav.name }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NavItem } from '../common/types'

export default defineComponent({
  name: 'Nav',

  setup() {
    const router = useRouter()

    const navList: NavItem[] = []
    const reactiveData = reactive({
      // navList: [
      //   {
      //     name: 'Home',
      //     isActive: false,
      //     path: '/'
      //   }
      // ],
      navList,

      navClick(e: NavItem) {
        router.push(e.path)
      }
    })

    const changeNavActive = (currentPath: string) => {
      reactiveData.navList.forEach((v: NavItem) => {
        const temp = v
        temp.isActive = temp.path === currentPath
        return temp
      })
    }

    watch(
      () => router.currentRoute.value,
      (_n) => {
        changeNavActive(_n.path)
      }
    )

    onMounted(() => {
      router.isReady().then(() => {
        changeNavActive(router.currentRoute.value.path)
      })

      // console.error(router.getRoutes())
      const routes = router.getRoutes()
      routes.forEach((e) => {
        reactiveData.navList.push({
          name: String(e.name),
          isActive: false,
          path: e.path
        })
      })
    })

    return {
      ...toRefs(reactiveData)
    }
  }
})
</script>

<style scoped lang="scss">
.nav {
  background: #3333;

  display: flex;
  flex-direction: column;

  .nav-item {
    margin: 5px;
    background: #3333;

    cursor: pointer;

    &:hover {
      background: red;
    }

    &.active {
      background: red;
    }
  }
}
</style>
