import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path' // 如果编辑器提示 path 模块找不到，则可以安装一下 @types/node -> npm i @types/node -D

import cesium from 'vite-plugin-cesium'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), cesium()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src') // 设置 `@` 指向 `src` 目录
    }
  },
  // base: './', // 设置打包路径
  base: '/zgz/', // 设置打包路径
  server: {
    port: 4500, // 设置服务启动端口号
    open: true, // 设置服务启动时是否自动打开浏览器
    cors: true // 允许跨域

    // 设置代理，根据我们项目实际情况配置
    // proxy: {
    //   '/api': {
    //     target: 'http://xxx.xxx.xxx.xxx:x000',
    //     changeOrigin: true,
    //     secure: false,
    //     rewrite: (path) => path.replace('/api/', '/')
    //   }
    // },
  },
  build: {
    outDir: 'dist/zgz',
    terserOptions: {
      compress: {
        // Used to delete console in production environment
        drop_console: true,
      },
    },
  },
})
