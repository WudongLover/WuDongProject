<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api'
import { unwrapError } from '@/api'
import { useUserStore } from '@/stores/user'
import { scene } from '@/mock/images'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const mode = ref<'login' | 'register'>((route.query.mode as 'register') === 'register' ? 'register' : 'login')
const loginWay = ref<'sms' | 'pwd'>('sms')

const phone = ref('')
const smsCode = ref('')
const password = ref('')
const name = ref('')
const sending = ref(false)
const countdown = ref(0)
const errText = ref('')
const loading = ref(false)

const sideImg = scene('Miao village wooden stilt houses in morning mist, indigo tone', 'portrait_16_9')

async function sendCode() {
  errText.value = ''
  if (sending.value || countdown.value) return
  sending.value = true
  try {
    const res = await api.sendSmsCode(phone.value)
    userStore.toast(res.data.hint)
    countdown.value = 60
    const t = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) clearInterval(t)
    }, 1000)
  } catch (e) {
    errText.value = unwrapError(e).message
  } finally {
    sending.value = false
  }
}

async function submit() {
  errText.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      if (loginWay.value === 'sms') await userStore.login({ phone: phone.value, smsCode: smsCode.value })
      else await userStore.login({ phone: phone.value, password: password.value })
    } else {
      await userStore.register({ phone: phone.value, smsCode: smsCode.value, password: password.value, name: name.value })
    }
    userStore.toast(`欢迎回来，${userStore.user?.name}`)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e) {
    errText.value = unwrapError(e).message
  } finally {
    loading.value = false
  }
}

const submitText = computed(() =>
  loading.value ? '处理中…' : mode.value === 'login' ? '登 录' : '注 册',
)
</script>

<template>
  <div class="auth-page">
    <div class="auth-side">
      <img :src="sideImg" alt="乌东苗寨" />
      <div class="side-mask"></div>
      <div class="side-quote">
        <p>「一个人来乌东，<br />绝不让你一个人走。」</p>
        <span>—— 游记《一个人的乌东》</span>
      </div>
    </div>

    <div class="auth-panel">
      <div class="auth-box">
        <div class="tabs">
          <button :class="{ on: mode === 'login' }" @click="mode = 'login'">登录</button>
          <button :class="{ on: mode === 'register' }" @click="mode = 'register'">注册</button>
        </div>

        <template v-if="mode === 'login'">
          <div class="way-switch">
            <button :class="{ on: loginWay === 'sms' }" @click="loginWay = 'sms'">验证码登录</button>
            <span></span>
            <button :class="{ on: loginWay === 'pwd' }" @click="loginWay = 'pwd'">密码登录</button>
          </div>

          <div class="field">
            <label>手机号</label>
            <input v-model="phone" maxlength="11" placeholder="请输入 11 位手机号" />
          </div>

          <div v-if="loginWay === 'sms'" class="field">
            <label>验证码</label>
            <div class="code-row">
              <input v-model="smsCode" maxlength="6" placeholder="6 位验证码" @keyup.enter="submit" />
              <button class="btn btn-ghost code-btn" :disabled="countdown > 0 || sending" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
              </button>
            </div>
          </div>

          <div v-else class="field">
            <label>密码</label>
            <input v-model="password" type="password" placeholder="8-20 位，含字母与数字" @keyup.enter="submit" />
          </div>
        </template>

        <template v-else>
          <div class="field">
            <label>昵称</label>
            <input v-model="name" maxlength="12" placeholder="给自己起个名字" />
          </div>
          <div class="field">
            <label>手机号</label>
            <input v-model="phone" maxlength="11" placeholder="仅支持中国大陆手机号" />
          </div>
          <div class="field">
            <label>验证码</label>
            <div class="code-row">
              <input v-model="smsCode" maxlength="6" placeholder="6 位验证码" />
              <button class="btn btn-ghost code-btn" :disabled="countdown > 0 || sending" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>设置密码</label>
            <input v-model="password" type="password" placeholder="8-20 位，需同时包含字母与数字" @keyup.enter="submit" />
          </div>
        </template>

        <p v-if="errText" class="err"><AppIcon name="close" :size="13" /> {{ errText }}</p>

        <button class="btn btn-primary btn-lg submit" :disabled="loading" @click="submit">{{ submitText }}</button>

        <p class="hint">演示环境：验证码随机生成并打印在后端控制台（app/wu_dong_midway 终端），5 分钟内有效</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: minmax(320px, 46%) 1fr;
  min-height: calc(100vh - 64px);
}

.auth-side {
  position: relative;
  overflow: hidden;
}

.auth-side img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.side-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 35, 56, 0.1) 30%, rgba(15, 35, 56, 0.72));
}

.side-quote {
  position: absolute;
  left: 40px;
  bottom: 44px;
  color: var(--silver-light);
}

.side-quote p {
  font-family: var(--font-display);
  font-size: clamp(18px, 2vw, 24px);
  line-height: 1.9;
  letter-spacing: 0.12em;
}

.side-quote span {
  display: block;
  margin-top: 12px;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: rgba(215, 224, 230, 0.6);
}

.auth-panel {
  display: grid;
  place-items: center;
  padding: 48px 20px;
  background:
    radial-gradient(circle at 80% 12%, rgba(35, 69, 107, 0.06), transparent 42%),
    var(--paper);
}

.auth-box {
  width: min(400px, 100%);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 34px 36px 30px;
  box-shadow: var(--shadow-1);
  animation: rise 0.6s var(--ease) both;
}

.tabs {
  display: flex;
  gap: 26px;
  margin-bottom: 22px;
}

.tabs button {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.2em;
  color: var(--text-3);
  padding-bottom: 6px;
  border-bottom: 3px solid transparent;
  transition: all 0.25s;
}

.tabs button.on {
  color: var(--ink);
  border-color: var(--accent);
}

.way-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  font-size: 13px;
}

.way-switch button {
  color: var(--text-2);
  letter-spacing: 0.05em;
  padding: 3px 2px;
  border-bottom: 2px solid transparent;
}

.way-switch button.on {
  color: var(--primary);
  font-weight: 700;
  border-color: var(--primary);
}

.way-switch span {
  width: 1px;
  height: 12px;
  background: var(--line-strong);
}

.field {
  margin-bottom: 16px;
}

.code-row {
  display: flex;
  gap: 10px;
}

.code-row input {
  flex: 1;
}

.code-btn {
  flex: none;
  font-size: 12.5px;
  padding: 0 14px;
  letter-spacing: 0.02em;
}

.err {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
  font-size: 12.5px;
  margin: 2px 0 10px;
}

.submit {
  width: 100%;
  margin-top: 8px;
}

.hint {
  margin-top: 16px;
  text-align: center;
  font-size: 11.5px;
  color: var(--text-3);
  letter-spacing: 0.05em;
}

@media (max-width: 899px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-side {
    display: none;
  }
}
</style>
