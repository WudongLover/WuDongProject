<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { Address, Message, UserProfile, UserStats } from '@/types'
import { useUserStore } from '@/stores/user'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const userStore = useUserStore()

type Panel = 'profile' | 'security' | 'favorites' | 'addresses' | 'messages'
const panel = ref<Panel>('profile')

const profileForm = ref({ name: '', bio: '' })
const pwdForm = ref({ oldPassword: '', newPassword: '', confirm: '' })
const pwdSaving = ref(false)
const favorites = ref<
  {
    id: string
    targetType: string
    targetId: string
    name: string
    cover: string
    type: string
    price?: number
    to?: string
  }[]
>([])
const messages = ref<Message[]>([])
const addresses = ref<Address[]>([])
const stats = ref<UserStats>({ favorites: 0, unreadMessages: 0, likesReceived: 0 })
const addressFormVisible = ref(false)
const addressEditingId = ref('')
const addressSaving = ref(false)
const addressForm = ref({ name: '', phone: '', region: '', detail: '', isDefault: false })
const loading = ref(false)

const favType = ref('全部')
const favTypes = ['全部', '非遗商品', '特产', '民宿', '餐厅', '路线', '游记']

function favTo(t: string, id: string): string {
  if (t === '非遗商品' || t === '特产') return `/product/${id}`
  if (t === '民宿') return `/stay/${id}`
  if (t === '餐厅') return `/restaurants/${id}`
  if (t === '路线') return `/routes/${id}`
  return `/posts/${id}`
}

async function loadFavorites() {
  const res = await api.getFavorites()
  favorites.value = res.data.map((f) => ({ ...f, to: favTo(f.type, f.id) }))
}

async function loadMessages() {
  const res = await api.messageApi.list()
  messages.value = res.data
}

async function loadAddresses() {
  const res = await api.addressApi.list()
  addresses.value = res.data
}

async function loadStats() {
  const res = await api.getUserStats()
  stats.value = res.data
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    userStore.toast('请先登录')
    return
  }
  profileForm.value = { name: userStore.user!.name, bio: userStore.user!.bio }
  loading.value = true
  try {
    await Promise.all([loadFavorites(), loadMessages(), loadStats(), loadAddresses()])
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  } finally {
    loading.value = false
  }
})

async function saveProfile() {
  try {
    const res = await api.updateProfile(profileForm.value)
    userStore.user = res.data as UserProfile
    sessionStorage.setItem('wudong_user', JSON.stringify(userStore.user))
    userStore.toast('资料已保存')
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

/** 设置/修改登录密码 */
async function savePassword() {
  const { oldPassword, newPassword, confirm } = pwdForm.value
  if (!newPassword || newPassword !== confirm) {
    userStore.toast('两次输入的新密码不一致')
    return
  }
  pwdSaving.value = true
  try {
    const res = await api.setPassword({
      newPassword,
      oldPassword: oldPassword ? oldPassword : undefined,
    })
    userStore.user = res.data as UserProfile
    sessionStorage.setItem('wudong_user', JSON.stringify(userStore.user))
    pwdForm.value = { oldPassword: '', newPassword: '', confirm: '' }
    userStore.toast('密码已更新，可用手机号 + 密码登录')
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  } finally {
    pwdSaving.value = false
  }
}

async function readAll() {
  try {
    await api.messageApi.markAllRead()
    await Promise.all([loadMessages(), loadStats()])
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function readOne(m: Message) {
  try {
    await api.messageApi.markRead(m.id)
    await Promise.all([loadMessages(), loadStats()])
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function unfav(f: { targetType: string; targetId: string; id: string }) {
  try {
    await api.toggleFavorite(f.targetType, f.targetId)
    userStore.toast('已取消收藏')
    await Promise.all([loadFavorites(), loadStats()])
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

function startAddAddress() {
  addressEditingId.value = ''
  addressForm.value = { name: '', phone: '', region: '', detail: '', isDefault: false }
  addressFormVisible.value = true
}

function startEditAddress(address: Address) {
  addressEditingId.value = address.id
  addressForm.value = {
    name: address.name,
    phone: address.phone,
    region: address.region,
    detail: address.detail,
    isDefault: address.isDefault,
  }
  addressFormVisible.value = true
}

function cancelAddressEdit() {
  addressFormVisible.value = false
  addressEditingId.value = ''
  addressForm.value = { name: '', phone: '', region: '', detail: '', isDefault: false }
}

async function saveAddress() {
  const payload = {
    name: addressForm.value.name.trim(),
    phone: addressForm.value.phone.trim(),
    region: addressForm.value.region.trim(),
    detail: addressForm.value.detail.trim(),
    isDefault: addressForm.value.isDefault,
  }
  if (!payload.name || !payload.region || !payload.detail) {
    userStore.toast('请完整填写收货信息')
    return
  }
  if (!/^1\d{10}$/.test(payload.phone)) {
    userStore.toast('请输入正确的手机号')
    return
  }
  addressSaving.value = true
  try {
    if (addressEditingId.value) {
      await api.addressApi.update(addressEditingId.value, payload)
      userStore.toast('地址已更新')
    } else {
      await api.addressApi.create(payload)
      userStore.toast('地址已新增')
    }
    cancelAddressEdit()
    await loadAddresses()
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  } finally {
    addressSaving.value = false
  }
}

async function setDefaultAddress(address: Address) {
  if (address.isDefault) return
  try {
    await api.addressApi.setDefault(address.id)
    userStore.toast('已设为默认地址')
    await loadAddresses()
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

async function removeAddress(address: Address) {
  if (!window.confirm(`确定删除“${address.name}”的收货地址吗？`)) return
  try {
    await api.addressApi.remove(address.id)
    userStore.toast('地址已删除')
    if (addressEditingId.value === address.id) cancelAddressEdit()
    await loadAddresses()
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}
</script>

<template>
  <div class="user-page container">
    <template v-if="userStore.isLoggedIn && userStore.user">
      <!-- 头部资料卡 -->
      <div class="u-hero">
        <img class="avatar" :src="userStore.user.avatar" :alt="userStore.user.name" />
        <div class="u-name">
          <h1>{{ userStore.user.name }}</h1>
          <p>{{ userStore.user.bio || '这个人很懒，什么都没写' }}</p>
          <span class="phone">{{ userStore.user.phone }}</span>
        </div>
        <div class="u-stats">
          <div><b>{{ stats.favorites }}</b><span>收藏</span></div>
          <div><b>{{ stats.unreadMessages }}</b><span>未读消息</span></div>
          <div><b>{{ stats.likesReceived }}</b><span>获赞</span></div>
        </div>
      </div>

      <div class="u-layout">
        <aside class="u-menu">
          <button :class="{ on: panel === 'profile' }" @click="panel = 'profile'">
            <AppIcon name="user" :size="16" /> 我的资料
          </button>
          <button :class="{ on: panel === 'security' }" @click="panel = 'security'">
            <AppIcon name="eye" :size="16" /> 账号安全
          </button>
          <button :class="{ on: panel === 'favorites' }" @click="panel = 'favorites'">
            <AppIcon name="heart" :size="16" /> 我的收藏
          </button>
          <button :class="{ on: panel === 'addresses' }" @click="panel = 'addresses'">
            <AppIcon name="location" :size="16" /> 收货地址
          </button>
          <button :class="{ on: panel === 'messages' }" @click="panel = 'messages'">
            <AppIcon name="message" :size="16" /> 消息通知
            <i v-if="messages.some((m) => !m.read)" class="dot"></i>
          </button>
          <router-link to="/orders" class="menu-link"><AppIcon name="ticket" :size="16" /> 我的订单</router-link>
          <router-link to="/cart" class="menu-link"><AppIcon name="cart" :size="16" /> 购物车</router-link>
          <button class="quit" @click="userStore.logout(); userStore.toast('已退出登录')">
            <AppIcon name="close" :size="16" /> 退出登录
          </button>
        </aside>

        <main class="u-panel">
          <!-- 我的资料 -->
          <section v-if="panel === 'profile'" class="panel">
            <h3>我的资料</h3>
            <div class="field">
              <label>昵称</label>
              <input v-model="profileForm.name" maxlength="12" />
            </div>
            <div class="field">
              <label>个人简介</label>
              <textarea v-model="profileForm.bio" rows="3" maxlength="60" placeholder="一句话介绍自己"></textarea>
            </div>
            <div class="field">
              <label>手机号（脱敏展示）</label>
              <input :value="userStore.user.phone" disabled />
            </div>
            <button class="btn btn-primary" @click="saveProfile">保存修改</button>
          </section>

          <!-- 账号安全：设置 / 修改登录密码 -->
          <section v-else-if="panel === 'security'" class="panel">
            <h3>账号安全</h3>
            <p class="sec-tip">
              {{
                userStore.user.hasPassword
                  ? '修改登录密码：保存后旧密码立即失效。'
                  : '你还没有设置密码，设置后即可用「手机号 + 密码」登录。'
              }}
            </p>
            <div v-if="userStore.user.hasPassword" class="field">
              <label>当前密码</label>
              <input
                v-model="pwdForm.oldPassword"
                type="password"
                autocomplete="current-password"
                placeholder="请输入当前密码"
              />
            </div>
            <div class="field">
              <label>新密码</label>
              <input
                v-model="pwdForm.newPassword"
                type="password"
                autocomplete="new-password"
                placeholder="8-20 位，需同时包含字母与数字"
              />
            </div>
            <div class="field">
              <label>确认新密码</label>
              <input
                v-model="pwdForm.confirm"
                type="password"
                autocomplete="new-password"
                placeholder="再次输入新密码"
                @keyup.enter="savePassword"
              />
            </div>
            <button class="btn btn-primary" :disabled="pwdSaving" @click="savePassword">
              {{ userStore.user.hasPassword ? '修改密码' : '设置密码' }}
            </button>
          </section>

          <!-- 我的收藏 -->
          <section v-else-if="panel === 'favorites'" class="panel">
            <div class="panel-head">
              <h3>我的收藏</h3>
              <div class="mini-tabs">
                <button
                  v-for="t in favTypes"
                  :key="t"
                  :class="{ on: favType === t }"
                  @click="favType = t"
                >
                  {{ t }}
                </button>
              </div>
            </div>
            <EmptyState v-if="!favorites.filter((f) => favType === '全部' || f.type === favType).length" text="还没有收藏内容" />
            <div class="fav-grid">
              <div
                v-for="f in favorites.filter((x) => favType === '全部' || x.type === favType)"
                :key="f.id"
                class="fav-item"
              >
                <router-link :to="f.to!">
                  <img :src="f.cover" :alt="f.name" />
                  <b>{{ f.name }}</b>
                  <span class="ft">{{ f.type }}</span>
                  <span v-if="f.price" class="price">{{ f.price }}</span>
                </router-link>
                <button class="unfav" aria-label="取消收藏" @click="unfav(f)">
                  <AppIcon name="heart" :size="14" />
                </button>
              </div>
            </div>
          </section>

          <!-- 收货地址 -->
          <section v-else-if="panel === 'addresses'" class="panel">
            <div class="panel-head">
              <h3>收货地址</h3>
              <button class="btn btn-outline" @click="startAddAddress">
                <AppIcon name="plus" :size="15" /> 新增地址
              </button>
            </div>

            <div v-if="addressFormVisible" class="addr-form">
              <b>{{ addressEditingId ? '编辑地址' : '新增地址' }}</b>
              <div class="addr-fields">
                <label>
                  <span>收货人</span>
                  <input v-model="addressForm.name" maxlength="64" placeholder="请输入收货人姓名" />
                </label>
                <label>
                  <span>手机号</span>
                  <input v-model="addressForm.phone" maxlength="11" placeholder="请输入手机号" />
                </label>
                <label class="wide">
                  <span>地区</span>
                  <input v-model="addressForm.region" maxlength="128" placeholder="省 / 市 / 区" />
                </label>
                <label class="wide">
                  <span>详细地址</span>
                  <input v-model="addressForm.detail" maxlength="255" placeholder="街道、楼栋、门牌号" />
                </label>
              </div>
              <label class="addr-default">
                <input v-model="addressForm.isDefault" type="checkbox" />
                设为默认地址
              </label>
              <div class="form-actions">
                <button class="btn btn-ghost" @click="cancelAddressEdit">取消</button>
                <button class="btn btn-primary" :disabled="addressSaving" @click="saveAddress">
                  {{ addressSaving ? '保存中...' : '保存地址' }}
                </button>
              </div>
            </div>

            <EmptyState v-if="!addresses.length" text="暂无收货地址" />
            <div v-else class="addr-list">
              <div v-for="a in addresses" :key="a.id" class="addr" :class="{ def: a.isDefault }">
                <div class="a-top">
                  <b>{{ a.name }}</b>
                  <span>{{ a.phone }}</span>
                  <i v-if="a.isDefault" class="tag tag-red">默认</i>
                </div>
                <p>{{ a.region }} {{ a.detail }}</p>
                <div class="addr-actions">
                  <button v-if="!a.isDefault" @click="setDefaultAddress(a)">
                    <AppIcon name="star" :size="14" /> 设为默认
                  </button>
                  <button @click="startEditAddress(a)">编辑</button>
                  <button class="danger" @click="removeAddress(a)">删除</button>
                </div>
              </div>
            </div>
            <p class="note">衣 / 食（特产）实物订单将使用收货地址配送；身份证等敏感信息按规范脱敏存储。</p>
          </section>

          <!-- 消息 -->
          <section v-else class="panel">
            <div class="panel-head">
              <h3>消息通知</h3>
              <button class="btn btn-ghost" @click="readAll">全部已读</button>
            </div>
            <EmptyState v-if="!messages.length" text="暂无消息" />
            <div
              v-for="m in messages"
              :key="m.id"
              class="msg"
              :class="{ unread: !m.read }"
              @click="readOne(m)"
            >
              <span class="m-icon">
                <AppIcon :name="m.type === 'ORDER' ? 'ticket' : m.type === 'INTERACT' ? 'heart' : 'bell'" :size="16" />
              </span>
              <div>
                <b>{{ m.title }}</b>
                <p>{{ m.content }}</p>
              </div>
              <time>{{ m.date }}</time>
            </div>
          </section>
        </main>
      </div>
    </template>

    <EmptyState v-else text="登录后查看个人中心">
      <router-link to="/login" class="btn btn-primary">去登录</router-link>
    </EmptyState>
  </div>
</template>

<style scoped>
.user-page {
  padding-top: 36px;
  min-height: 50vh;
}

.u-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  background:
    radial-gradient(ellipse at 92% 0%, rgba(192, 138, 45, 0.16), transparent 45%),
    var(--indigo-deep);
  border-radius: var(--radius-lg);
  padding: 30px 34px;
  color: var(--silver-light);
}

.avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(215, 224, 230, 0.4);
}

.u-name h1 {
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: 0.1em;
}

.u-name p {
  font-size: 13px;
  color: rgba(215, 224, 230, 0.7);
  margin-top: 4px;
}

.phone {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--amber);
  border: 1px solid rgba(192, 138, 45, 0.5);
  border-radius: 999px;
  padding: 1px 12px;
  letter-spacing: 0.1em;
}

.u-stats {
  margin-left: auto;
  display: flex;
  gap: 34px;
  text-align: center;
}

.u-stats b {
  display: block;
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--amber);
}

.u-stats span {
  font-size: 11.5px;
  color: rgba(215, 224, 230, 0.6);
  letter-spacing: 0.15em;
}

.u-layout {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 26px;
  margin-top: 24px;
  align-items: start;
}

.u-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 12px;
  position: sticky;
  top: 84px;
}

.u-menu button,
.menu-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  font-size: 14px;
  color: var(--text-2);
  border-radius: var(--radius);
  position: relative;
  transition: all 0.2s;
  letter-spacing: 0.05em;
}

.u-menu button:hover,
.menu-link:hover {
  color: var(--primary);
  background: rgba(35, 69, 107, 0.06);
}

.u-menu button.on {
  color: var(--primary);
  font-weight: 700;
  background: rgba(35, 69, 107, 0.09);
}

.dot {
  position: absolute;
  right: 14px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
}

.quit {
  margin-top: 8px;
  border-top: 1px dashed var(--line);
  padding-top: 14px;
  color: var(--text-3);
}

.quit:hover {
  color: var(--accent);
}

.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 26px 30px;
}

.panel h3 {
  font-family: var(--font-display);
  font-size: 18px;
  margin-bottom: 20px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.panel-head h3 {
  margin-bottom: 0;
}

.field {
  margin-bottom: 16px;
  max-width: 420px;
}

.sec-tip {
  margin: -8px 0 18px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-2);
}

.mini-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mini-tabs button {
  font-size: 12px;
  padding: 3px 13px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--text-2);
}

.mini-tabs button.on {
  background: var(--indigo);
  border-color: var(--indigo);
  color: var(--silver-light);
}

.fav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 16px;
}

.fav-item {
  position: relative;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #fff;
  transition: transform 0.25s var(--ease), box-shadow 0.25s;
}

.fav-item:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-1);
}

.fav-item img {
  width: 100%;
  aspect-ratio: 16/10;
  object-fit: cover;
}

.fav-item b {
  display: block;
  padding: 10px 12px 2px;
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-item .ft {
  font-size: 11px;
  color: var(--primary);
  padding: 0 12px;
  letter-spacing: 0.1em;
}

.fav-item .price {
  display: block;
  padding: 4px 12px 12px;
  font-size: 15px;
}

.unfav {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  color: var(--accent);
}

.addr-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

.addr-form {
  margin: 16px 0 20px;
  padding: 18px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
  background: var(--paper);
}

.addr-form > b {
  display: block;
  margin-bottom: 14px;
  font-size: 14px;
}

.addr-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
}

.addr-fields label {
  display: grid;
  gap: 6px;
}

.addr-fields label span {
  color: var(--text-2);
  font-size: 12px;
}

.addr-fields input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: #fff;
  padding: 10px 12px;
  font-size: 13px;
}

.addr-fields .wide {
  grid-column: 1 / -1;
}

.addr-default {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  color: var(--text-2);
  font-size: 13px;
}

.addr-default input {
  accent-color: var(--accent);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.addr {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 15px 18px;
  transition: border-color 0.2s;
}

.addr.def {
  border-color: rgba(181, 68, 46, 0.45);
  background: rgba(181, 68, 46, 0.03);
}

.a-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.a-top b {
  font-size: 14.5px;
}

.a-top span {
  font-size: 12.5px;
  color: var(--text-3);
}

.a-top i {
  margin-left: auto;
}

.addr p {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.8;
}

.addr-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--line);
}

.addr-actions button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--primary);
  font-size: 12px;
}

.addr-actions button:hover {
  color: var(--accent);
}

.addr-actions .danger {
  color: var(--accent);
  margin-left: auto;
}

.note {
  font-size: 12px;
  color: var(--text-3);
}

.msg {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 15px 12px;
  border-bottom: 1px dashed var(--line);
  cursor: pointer;
  transition: background 0.2s;
  border-radius: var(--radius);
}

.msg:hover {
  background: var(--paper);
}

.msg.unread {
  background: rgba(35, 69, 107, 0.04);
}

.m-icon {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  background: var(--indigo-mist);
  color: var(--primary);
  border-radius: 50%;
}

.msg b {
  font-size: 14px;
}

.msg p {
  font-size: 12.5px;
  color: var(--text-2);
  margin-top: 3px;
}

.msg time {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--text-3);
  white-space: nowrap;
}

@media (max-width: 899px) {
  .u-layout {
    grid-template-columns: 1fr;
  }

  .u-menu {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .u-menu .quit {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
  }

  .u-hero {
    flex-wrap: wrap;
  }

  .u-stats {
    margin-left: 0;
    width: 100%;
    justify-content: space-around;
  }

  .fav-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .addr-list {
    grid-template-columns: 1fr;
  }

  .addr-fields {
    grid-template-columns: 1fr;
  }

  .addr-fields .wide {
    grid-column: auto;
  }
}
</style>
