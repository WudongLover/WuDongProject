<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const keyword = ref(route.query.kw as string || '')
const mobileOpen = ref(false)

const navs = [
  { label: '首页', to: '/', glyph: '寨' },
  { label: '衣 · 非遗', to: '/goods', glyph: '衣' },
  { label: '食 · 风味', to: '/food', glyph: '食' },
  { label: '住 · 山居', to: '/stay', glyph: '住' },
  { label: '行 · 山水', to: '/trip', glyph: '行' },
  { label: '社区', to: '/community', glyph: '记' },
]

const activePath = computed(() => '/' + (route.path.split('/')[1] || ''))
const userLabel = computed(() => userStore.user?.name || '登录')

function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  mobileOpen.value = false
  router.push({ path: '/search', query: { kw } })
}

function logout() {
  userStore.logout()
  userStore.toast('已退出登录')
  router.push('/')
}

watch(
  () => route.fullPath,
  () => (mobileOpen.value = false),
)
</script>

<template>
  <header class="site-header">
    <div class="header-inner container">
      <router-link to="/" class="logo" aria-label="乌东文旅首页">
        <span class="logo-seal">乌东</span>
        <span class="logo-text">
          <b>乌东文旅</b>
          <i>WUDONG · MIAO VILLAGE</i>
        </span>
      </router-link>

      <nav class="nav" :class="{ open: mobileOpen }">
        <router-link
          v-for="n in navs"
          :key="n.to"
          :to="n.to"
          class="nav-item"
          :class="{ active: activePath === n.to }"
        >
          <span class="nav-glyph">{{ n.glyph }}</span>
          <span>{{ n.label }}</span>
        </router-link>
      </nav>

      <div class="header-right">
        <div class="search-box">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索银饰 / 长桌宴 / 民宿…"
            @keyup.enter="doSearch"
          />
          <button aria-label="搜索" @click="doSearch"><AppIcon name="search" /></button>
        </div>

        <router-link to="/cart" class="icon-btn" aria-label="购物车">
          <AppIcon name="cart" :size="20" />
          <i v-if="cartStore.count" class="badge">{{ cartStore.count }}</i>
        </router-link>

        <div class="user-box">
          <template v-if="userStore.isLoggedIn">
            <router-link to="/user" class="icon-btn" :title="userLabel">
              <AppIcon name="user" :size="20" />
            </router-link>
            <button class="logout" @click="logout">退出</button>
          </template>
          <router-link v-else to="/login" class="login-btn">登录 / 注册</router-link>
        </div>

        <button class="icon-btn burger" aria-label="菜单" @click="mobileOpen = !mobileOpen">
          <AppIcon :name="mobileOpen ? 'close' : 'menu'" :size="22" />
        </button>
      </div>
    </div>

    <transition name="drop">
      <div v-if="mobileOpen" class="mobile-panel">
        <router-link v-for="n in navs" :key="n.to" :to="n.to" class="m-item">
          <span class="nav-glyph">{{ n.glyph }}</span>{{ n.label }}
        </router-link>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(246, 243, 236, 0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 26px;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.logo-seal {
  width: 40px;
  height: 40px;
  background: var(--indigo-deep);
  color: var(--silver-light);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 15px;
  line-height: 1.1;
  display: grid;
  place-items: center;
  border-radius: 4px;
  letter-spacing: 1px;
  writing-mode: vertical-rl;
  box-shadow: inset 0 0 0 1.5px rgba(215, 224, 230, 0.35);
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.logo-text b {
  font-family: var(--font-display);
  font-size: 17px;
  letter-spacing: 0.22em;
  color: var(--ink);
}

.logo-text i {
  font-style: normal;
  font-size: 9px;
  letter-spacing: 0.24em;
  color: var(--text-3);
}

.nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  font-size: 14px;
  letter-spacing: 0.05em;
  color: var(--text-2);
  border-radius: var(--radius);
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--primary);
  background: rgba(35, 69, 107, 0.07);
}

.nav-item.active {
  color: var(--primary);
  font-weight: 700;
  background: rgba(35, 69, 107, 0.1);
}

.nav-glyph {
  font-family: var(--font-display);
  font-weight: 900;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--silver-light);
  background: var(--indigo);
  border-radius: 3px;
}

.nav-item.active .nav-glyph {
  background: var(--accent);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}

.search-box {
  display: flex;
  align-items: center;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: #fff;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(35, 69, 107, 0.12);
}

.search-box input {
  border: none;
  padding: 7px 10px;
  width: 190px;
  font-size: 13px;
  background: transparent;
}

.search-box button {
  padding: 7px 9px;
  color: var(--text-3);
  display: grid;
  place-items: center;
}

.search-box button:hover {
  color: var(--primary);
}

.icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: var(--radius);
  color: var(--text-2);
  transition: all 0.2s;
}

.icon-btn:hover {
  color: var(--primary);
  background: rgba(35, 69, 107, 0.08);
}

.badge {
  position: absolute;
  top: 2px;
  right: 1px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-style: normal;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 4px;
}

.login-btn {
  padding: 8px 16px;
  border: 1.5px solid var(--accent);
  color: var(--accent);
  border-radius: var(--radius);
  font-size: 13px;
  letter-spacing: 0.06em;
  transition: all 0.2s;
  white-space: nowrap;
}

.login-btn:hover {
  background: var(--accent);
  color: #fff;
}

.logout {
  font-size: 12px;
  color: var(--text-3);
}

.logout:hover {
  color: var(--accent);
}

.burger {
  display: none;
}

.mobile-panel {
  display: none;
}

@media (max-width: 1023px) {
  .nav {
    display: none;
  }

  .burger {
    display: grid;
  }

  .search-box input {
    width: 120px;
  }

  .mobile-panel {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--line);
    background: var(--paper);
    padding: 8px 16px 14px;
  }

  .m-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 6px;
    border-bottom: 1px dashed var(--line);
    font-size: 15px;
    letter-spacing: 0.08em;
    color: var(--text);
  }

  .drop-enter-active,
  .drop-leave-active {
    transition: all 0.25s var(--ease);
  }

  .drop-enter-from,
  .drop-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@media (max-width: 599px) {
  .search-box {
    display: none;
  }

  .logout {
    display: none;
  }
}
</style>
