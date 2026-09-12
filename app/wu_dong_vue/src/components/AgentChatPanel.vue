<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { checkAgentStatus, streamAgentMessage } from '@/api/agent'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

const open = ref(false)
const loading = ref(false)
const available = ref(true)
const input = ref('')
const messages = ref<Message[]>([])
const sessionId = ref<number | null>(null)
const deviceId = ref('')
const listEl = ref<HTMLElement | null>(null)
// 等待首个增量期间显示"正在输入"动画，气泡出现后隐藏
const awaitingReply = ref(false)
// 当前进行中的流式请求与打字机，用于清空对话/卸载组件时中断
let activeStream: { abort: () => void } | null = null
let activeTypewriter: { stop: () => void } | null = null

// 面板宽度（可拖拽调整）
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 320
const MAX_WIDTH = 640
const panelWidth = ref(Number(localStorage.getItem('wudong_agent_panel_width')) || DEFAULT_WIDTH)
const isResizing = ref(false)

function startResize(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onResize(e: MouseEvent | TouchEvent) {
  if (!isResizing.value) return
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  let w = clientX
  w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w))
  panelWidth.value = w
}

function stopResize() {
  if (!isResizing.value) return
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem('wudong_agent_panel_width', String(panelWidth.value))
}

const SUGGESTIONS = [
  '乌东村有什么好玩的？',
  '帮我规划 2 天 1 晚的行程',
  '银饰怎么选？有什么推荐？',
  '从贵阳怎么到乌东？',
]

function getDeviceId(): string {
  let id = localStorage.getItem('wudong_agent_device_id')
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    localStorage.setItem('wudong_agent_device_id', id)
  }
  return id
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^[-•] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  html = html.replace(/\n/g, '<br>')
  return html
}

async function togglePanel() {
  open.value = !open.value
  if (open.value && messages.value.length === 0) {
    try {
      const res = await checkAgentStatus()
      available.value = res.data.available
    } catch {
      available.value = false
    }
    messages.value.push({
      role: 'assistant',
      content: available.value
        ? '来啦，我是乌东的本地向导。想逛寨子、找吃的、规划行程，都可以跟我聊。'
        : '智能体服务暂未启用，请稍后再试。',
    })
  }
}

async function send() {
  const content = input.value.trim()
  if (!content || loading.value || !available.value) return

  messages.value.push({ role: 'user', content })
  input.value = ''
  loading.value = true
  awaitingReply.value = true
  await scrollToBottom()

  // 助手气泡用数组下标定位：通过 messages.value[i] 拿到的是响应式代理，
  // 直接改 push 进去的原始对象不会触发更新，所以不能持有原对象引用。
  let replyIndex = -1
  let pendingSources: string[] | undefined

  const appendText = (text: string) => {
    if (replyIndex === -1) {
      messages.value.push({ role: 'assistant', content: '', sources: pendingSources })
      replyIndex = messages.value.length - 1
      awaitingReply.value = false
    }
    messages.value[replyIndex].content += text
  }

  // 打字机：增量先进缓冲，按节奏逐字吐出，避免整段文字瞬间出现。
  // 缓冲积压越多吐得越快，保证不会明显落后于模型输出速度。
  const TYPE_STEP_MS = 28
  let buffer = ''
  let timer: number | null = null
  let onIdle: (() => void) | null = null

  const step = () => {
    timer = null
    if (!buffer) {
      onIdle?.()
      onIdle = null
      return
    }
    const take = Math.max(1, Math.ceil(buffer.length / 10))
    appendText(buffer.slice(0, take))
    buffer = buffer.slice(take)
    scheduleScroll()
    timer = window.setTimeout(step, TYPE_STEP_MS)
  }

  const typewriter = {
    push(text: string) {
      buffer += text
      if (timer === null) timer = window.setTimeout(step, TYPE_STEP_MS)
    },
    /** 等缓冲全部显示完 */
    waitIdle(): Promise<void> {
      if (!buffer && timer === null) return Promise.resolve()
      return new Promise((resolve) => {
        onIdle = resolve
      })
    },
    /** 中断并丢弃未显示的缓冲 */
    stop() {
      if (timer !== null) window.clearTimeout(timer)
      timer = null
      buffer = ''
      onIdle?.()
      onIdle = null
    },
  }
  activeTypewriter = typewriter

  try {
    const stream = streamAgentMessage(content, sessionId.value, deviceId.value, {
      onMeta: (meta) => {
        sessionId.value = meta.sessionId
        pendingSources = meta.sources?.length ? meta.sources : undefined
        if (replyIndex !== -1) messages.value[replyIndex].sources = pendingSources
      },
      onDelta: (text) => {
        typewriter.push(text)
      },
    })
    activeStream = stream
    await stream.done
    // 等文字吐完再解除 loading，避免输入框提前解锁导致消息穿插
    await typewriter.waitIdle()
  } catch (err: any) {
    // 用户主动中断时不提示错误
    if (err?.name === 'AbortError') {
      typewriter.stop()
      return
    }
    const message = '抱歉，刚刚走神了，能再说一遍吗？' + (err?.message ? `（${err.message}）` : '')
    if (replyIndex !== -1) {
      // 已输出部分内容，追加错误提示，保留已有回复
      typewriter.push(`\n\n${message}`)
      await typewriter.waitIdle()
    } else {
      typewriter.stop()
      messages.value.push({ role: 'assistant', content: message })
    }
  } finally {
    activeStream = null
    activeTypewriter = null
    loading.value = false
    awaitingReply.value = false
    await scrollToBottom()
  }
}

function sendSuggestion(text: string) {
  input.value = text
  send()
}

async function scrollToBottom() {
  await nextTick()
  if (listEl.value) {
    listEl.value.scrollTop = listEl.value.scrollHeight
  }
}

// 流式输出时按帧节流滚动，避免每个增量都触发一次布局
let scrollScheduled = false
function scheduleScroll() {
  if (scrollScheduled) return
  scrollScheduled = true
  requestAnimationFrame(() => {
    scrollScheduled = false
    scrollToBottom()
  })
}

function clearChat() {
  activeStream?.abort()
  activeTypewriter?.stop()
  activeStream = null
  activeTypewriter = null
  messages.value = []
  sessionId.value = null
}

onMounted(() => {
  deviceId.value = getDeviceId()
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
  window.addEventListener('touchmove', onResize, { passive: false })
  window.addEventListener('touchend', stopResize)
})

onUnmounted(() => {
  activeStream?.abort()
  activeTypewriter?.stop()
  activeStream = null
  activeTypewriter = null
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
  window.removeEventListener('touchmove', onResize)
  window.removeEventListener('touchend', stopResize)
})
</script>

<template>
  <!-- 左上角触发按钮 -->
  <button class="agent-trigger" :class="{ active: open }" @click="togglePanel" aria-label="AI 助手">
    <span class="trigger-diamond"></span>
    <span class="trigger-text">文旅助手</span>
  </button>

  <!-- 遮罩层 -->
  <transition name="fade">
    <div v-if="open" class="agent-mask" @click="open = false"></div>
  </transition>

  <!-- 左侧聊天面板 -->
  <transition name="slide">
    <aside v-if="open" class="agent-panel" :style="{ width: panelWidth + 'px' }">
      <!-- 右边缘拖拽手柄 -->
      <div
        class="resize-handle"
        :class="{ resizing: isResizing }"
        @mousedown="startResize"
        @touchstart="startResize"
      >
        <span class="resize-grip"></span>
      </div>
      <!-- 顶部 -->
      <header class="panel-header">
        <div class="panel-title">
          <span class="panel-seal">AI</span>
          <div class="panel-title-text">
            <em>WUDONG · AI GUIDE</em>
            <b>乌东文旅小助手</b>
          </div>
        </div>
        <div class="panel-status">
          <span class="status-dot" :class="{ online: available }"></span>
          <span>{{ available ? '在线' : '离线' }}</span>
        </div>
        <div class="panel-actions">
          <button class="action-btn" title="清空对话" @click="clearChat">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
          <button class="action-btn" title="关闭" @click="open = false">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <!-- 苗纹分隔线 -->
        <div class="miao-divider">
          <i></i><i></i><i></i><i></i><i></i>
        </div>
      </header>

      <!-- 消息列表 -->
      <div ref="listEl" class="message-list">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="message"
          :class="msg.role"
        >
          <div class="msg-avatar">
            <span v-if="msg.role === 'assistant'">AI</span>
            <span v-else>我</span>
          </div>
          <div class="msg-bubble">
            <div class="msg-content" v-html="renderMarkdown(msg.content)"></div>
            <div v-if="msg.sources?.length" class="msg-sources">
              <span class="source-label">参</span>
              <span v-for="(s, si) in msg.sources" :key="si" class="source-tag">{{ s }}</span>
            </div>
          </div>
        </div>

        <!-- 等待首个增量时的加载动画 -->
        <div v-if="awaitingReply" class="message assistant">
          <div class="msg-avatar"><span>AI</span></div>
          <div class="msg-bubble typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- 快捷问题 -->
      <div v-if="messages.length <= 1" class="suggestions">
        <button
          v-for="s in SUGGESTIONS"
          :key="s"
          class="suggestion-btn"
          :disabled="loading || !available"
          @click="sendSuggestion(s)"
        >
          {{ s }}
        </button>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <textarea
          v-model="input"
          class="msg-input"
          placeholder="聊聊乌东…"
          :disabled="loading || !available"
          rows="1"
          @keydown.enter.exact.prevent="send"
        ></textarea>
        <button class="send-btn" :disabled="loading || !input.trim() || !available" @click="send">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
/* ==================== 触发按钮 ==================== */
.agent-trigger {
  position: fixed;
  top: 14px;
  left: 16px;
  z-index: 1002;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px 7px 10px;
  background: rgba(246, 243, 236, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--indigo);
  cursor: pointer;
  box-shadow: var(--shadow-1);
  transition: all 0.3s var(--ease);
}

.agent-trigger:hover {
  border-color: var(--accent);
  color: var(--accent);
  box-shadow: var(--shadow-2);
  transform: translateY(-1px);
}

.agent-trigger.active {
  background: var(--indigo);
  border-color: var(--indigo);
  color: var(--silver-light);
}

.agent-trigger.active:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.trigger-diamond {
  width: 6px;
  height: 6px;
  background: currentColor;
  transform: rotate(45deg);
  flex: none;
  opacity: 0.7;
}

.trigger-text {
  line-height: 1;
}

/* ==================== 遮罩 ==================== */
.agent-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 35, 56, 0.3);
  backdrop-filter: blur(3px);
  z-index: 1001;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==================== 左侧面板 ==================== */
.agent-panel {
  position: fixed;
  top: 0;
  left: 0;
  max-width: 88vw;
  height: 100vh;
  background: var(--paper);
  z-index: 1003;
  display: flex;
  flex-direction: column;
  box-shadow: 6px 0 36px rgba(15, 35, 56, 0.16);
}

/* 右边缘拖拽手柄 */
.resize-handle {
  position: absolute;
  top: 0;
  right: -4px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.resize-handle:hover,
.resize-handle.resizing {
  background: rgba(35, 69, 107, 0.06);
}

.resize-grip {
  width: 3px;
  height: 40px;
  border-radius: 2px;
  background: var(--line-strong);
  opacity: 0.5;
  transition: all 0.2s;
}

.resize-handle:hover .resize-grip,
.resize-handle.resizing .resize-grip {
  background: var(--indigo);
  opacity: 1;
  height: 56px;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.4s var(--ease);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* ==================== 顶部 ==================== */
.panel-header {
  position: relative;
  padding: 18px 18px 0;
  flex: none;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-seal {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: var(--indigo-deep);
  color: var(--silver-light);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.05em;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1.5px rgba(215, 224, 230, 0.3);
  flex: none;
}

.panel-title-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.panel-title-text em {
  font-style: normal;
  font-size: 9.5px;
  letter-spacing: 0.28em;
  color: var(--accent);
  margin-bottom: 2px;
}

.panel-title-text b {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ink);
}

.panel-status {
  position: absolute;
  top: 22px;
  right: 80px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-3);
  letter-spacing: 0.08em;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-3);
}

.status-dot.online {
  background: #5a9e6f;
  box-shadow: 0 0 0 3px rgba(90, 158, 111, 0.18);
}

.panel-actions {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-3);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--indigo-mist);
  border-color: var(--line);
  color: var(--indigo);
}

/* 苗纹分隔线 */
.miao-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.miao-divider i {
  background: var(--line-strong);
  transform: rotate(45deg);
  flex: none;
}

.miao-divider i:nth-child(1) { width: 4px; height: 4px; opacity: 0.5; }
.miao-divider i:nth-child(2) { width: 5px; height: 5px; opacity: 0.7; }
.miao-divider i:nth-child(3) { width: 7px; height: 7px; background: var(--accent); opacity: 0.8; }
.miao-divider i:nth-child(4) { width: 5px; height: 5px; opacity: 0.7; }
.miao-divider i:nth-child(5) { width: 4px; height: 4px; opacity: 0.5; }

/* ==================== 消息列表 ==================== */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.message-list::-webkit-scrollbar {
  width: 5px;
}
.message-list::-webkit-scrollbar-thumb {
  background: rgba(35, 69, 107, 0.18);
  border-radius: 3px;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 100%;
}

.message.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 30px;
  height: 30px;
  flex: none;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.05em;
  border-radius: 4px;
}

.message.assistant .msg-avatar {
  background: var(--indigo);
  color: var(--silver-light);
}

.message.user .msg-avatar {
  background: var(--accent);
  color: #fff;
}

.msg-bubble {
  max-width: calc(100% - 42px);
  padding: 10px 14px;
  font-size: 13.5px;
  line-height: 1.8;
  word-break: break-word;
}

.message.assistant .msg-bubble {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 4px 10px 10px 10px;
  color: var(--text);
}

.message.user .msg-bubble {
  background: var(--indigo);
  color: var(--silver-light);
  border-radius: 10px 4px 10px 10px;
}

.msg-content :deep(strong) {
  font-weight: 700;
  color: inherit;
}

.message.assistant .msg-content :deep(strong) {
  color: var(--accent);
}

.msg-content :deep(a) {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.message.user .msg-content :deep(a) {
  color: var(--amber);
}

.msg-content :deep(ul) {
  margin: 6px 0;
  padding-left: 16px;
}

.msg-content :deep(li) {
  margin: 2px 0;
}

.msg-content :deep(h3),
.msg-content :deep(h4) {
  font-family: var(--font-display);
  font-weight: 700;
  margin: 8px 0 4px;
}

.message.assistant .msg-content :deep(h3),
.message.assistant .msg-content :deep(h4) {
  color: var(--ink);
}

/* 参考来源 */
.msg-sources {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}

.source-label {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  color: var(--accent);
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 1px solid var(--accent);
  border-radius: 3px;
  opacity: 0.7;
}

.source-tag {
  padding: 1px 8px;
  background: var(--indigo-mist);
  border-radius: 3px;
  font-size: 10.5px;
  color: var(--indigo);
  letter-spacing: 0.04em;
}

/* 打字动画 */
.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 14px;
}

.typing span {
  width: 6px;
  height: 6px;
  background: var(--indigo);
  border-radius: 50%;
  opacity: 0.35;
  animation: typing-bounce 1.2s infinite ease-in-out;
}

.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* ==================== 快捷问题 ==================== */
.suggestions {
  padding: 0 16px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  flex: none;
}

.suggestion-btn {
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--text-2);
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(181, 68, 46, 0.04);
}

.suggestion-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ==================== 输入区 ==================== */
.input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 14px 16px 18px;
  border-top: 1px solid var(--line);
  background: var(--paper);
  flex: none;
}

.msg-input {
  flex: 1;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 9px 12px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  max-height: 90px;
  line-height: 1.6;
  background: #fff;
  color: var(--text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.msg-input::placeholder {
  color: var(--text-3);
  letter-spacing: 0.06em;
}

.msg-input:focus {
  outline: none;
  border-color: var(--indigo);
  box-shadow: 0 0 0 3px rgba(35, 69, 107, 0.1);
}

.msg-input:disabled {
  background: var(--paper-2);
  cursor: not-allowed;
}

.send-btn {
  width: 38px;
  height: 38px;
  flex: none;
  display: grid;
  place-items: center;
  background: var(--indigo);
  color: var(--silver-light);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.25s var(--ease);
}

.send-btn:hover:not(:disabled) {
  background: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-1);
}

.send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ==================== 响应式 ==================== */
@media (max-width: 599px) {
  .agent-trigger {
    padding: 8px;
  }
  .trigger-text {
    display: none;
  }
  .trigger-diamond {
    margin: 0;
  }
  .panel-status {
    display: none;
  }
}
</style>
