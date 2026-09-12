import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 开发环境默认访问本机 6666；Docker Compose 中由环境变量切换到 api:8001。
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:6666',
        changeOrigin: true,
      },
    },
  },
})
