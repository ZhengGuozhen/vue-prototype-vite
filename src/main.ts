import { createApp } from 'vue'
import router from '@/router/index'
import { key, store } from '@/store'
import ElementPlus from 'element-plus'
import 'element-plus/packages/theme-chalk/src/index.scss'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus).use(router).use(store, key).mount('#app')
