import { createApp } from 'vue'
import router from '@/router/index'
import { key, store } from '@/store'

import ElementPlus from 'element-plus'
import 'element-plus/packages/theme-chalk/src/index.scss'

import 'xe-utils'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

import App from './App.vue'

import '@/style/tailwind.css';

const app = createApp(App)
app.use(ElementPlus).use(VXETable).use(router).use(store, key).mount('#app')
