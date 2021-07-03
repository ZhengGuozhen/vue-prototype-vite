<template>
  <main class="c-0">
    <div class="navi-button" @click="showNav = !showNav">菜单</div>
    <div v-show="showNav" class="navi">
      <Nav />
    </div>

    <div class="content">
      <router-view />
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Nav from '@/components/Nav.vue'

export default defineComponent({
  name: 'Main',
  components: {
    Nav
  },
  data() {
    return {
      showNav: true
    }
  }
})
</script>

<style scoped lang="scss">
.c-0 {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  .navi-button {
    position: absolute;
    z-index: 999;
    top: 10px;
    left: 10px;
    background: #3333;

    cursor: pointer;

    &:hover {
      background: red;
    }
  }
  .navi {
    position: absolute;
    z-index: 999;
    top: 50px;
    left: 0px;
  }

  .content {
    height: 100%;
    width: 100%;
  }
}
</style>
