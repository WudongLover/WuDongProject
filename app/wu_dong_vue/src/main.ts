import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { onUnauthorized } from './api/session'
import { useUserStore } from './stores/user'
import './styles/tokens.css'
import './styles/base.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const userStore = useUserStore(pinia)
userStore.bootstrap()

// 统一 401 出口：access token 续期失败即清登录态，并带 redirect 引导重新登录
onUnauthorized(() => {
  userStore.logout()
  const current = router.currentRoute.value
  if (current.name !== 'login') {
    router.replace({ path: '/login', query: { redirect: current.fullPath } })
  }
})

app.use(router)
app.mount('#app')
