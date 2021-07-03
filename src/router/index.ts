import { createRouter, createWebHashHistory, Router, RouteRecordRaw } from 'vue-router'
import Home from '@/views/Home.vue'
import Vuex from '@/views/Vuex.vue'
import Test from '@/views/Test.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/vuex',
    name: 'Vuex',
    component: Vuex
  },
  {
    path: '/axios',
    name: 'Axios',
    component: () => import('@/views/Axios.vue') // 懒加载 Axios 组件
  },
  {
    path: '/test',
    name: 'Test',
    component: Test
  },
  // ================
  {
    path: '/001',
    name: '001',
    component: () => import('@/views-z/001.vue')
  },
  {
    path: '/002-js',
    name: '002-js',
    component: () => import('@/views-z/002-js.vue')
  },
  {
    path: '/002-ts',
    name: '002-ts',
    component: () => import('@/views-z/002-ts.vue')
  },
  {
    path: '/003-threejs-map',
    name: '003-threejs-map',
    component: () => import('@/views-z/003-threejs-map.vue')
  },
  {
    path: '/004-cesium',
    name: '004-cesium',
    component: () => import('@/views-z/004-cesium.vue')
  }
]

const router: Router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
