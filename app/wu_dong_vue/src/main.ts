import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import './styles/tokens.css'
import './styles/base.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// bootstrap 是 async 方法，必须 await 完成后再挂载，否则首屏请求会缺少登录态
useUserStore(pinia)
  .bootstrap()
  .catch(() => {})
  .finally(() => app.mount('#app'))
