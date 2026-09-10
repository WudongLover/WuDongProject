<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import * as api from '@/api'
import type { Post } from '@/types'
import { useUserStore } from '@/stores/user'
import PostCard from '@/components/PostCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const userStore = useUserStore()

const posts = ref<Post[]>([])
const loading = ref(true)
const sort = ref<'hot' | 'new'>('hot')
const activeTopic = ref('')

const topics = ['#云海时刻', '#非遗体验', '#美食攻略', '#亲子出行', '#户外徒步', '#独行日记']

/** 活跃村民：从帖子数据聚合 top3 作者（按总点赞数） */
const hotUsers = computed(() => {
  const map = new Map<string, { id: string; name: string; bio: string; avatar: string; likesNum: number }>()
  for (const p of posts.value) {
    const a = p.author
    if (!a?.id) continue
    const prev = map.get(a.id)
    if (prev) {
      prev.likesNum += p.likes
    } else {
      map.set(a.id, { id: a.id, name: a.name, bio: a.bio ?? '', avatar: a.avatar, likesNum: p.likes })
    }
  }
  return [...map.values()]
    .sort((a, b) => b.likesNum - a.likesNum)
    .slice(0, 3)
    .map((u) => ({
      ...u,
      likes: u.likesNum >= 10000 ? `${(u.likesNum / 10000).toFixed(1)}万` : String(u.likesNum),
    }))
})

/** 发布弹窗装饰图（固定 URL，非 mock 生成） */
const publishImg = '/images/community-publish.jpg'

const showPublish = ref(false)
const pubTitle = ref('')
const pubContent = ref('')
const pubTopic = ref('#云海时刻')
const pubErr = ref('')

async function load() {
  loading.value = true
  const res = await api.getPosts()
  let list = [...res.data]
  if (activeTopic.value) list = list.filter((p) => p.topic === activeTopic.value)
  if (sort.value === 'hot') list.sort((a, b) => b.likes - a.likes)
  else list.sort((a, b) => b.date.localeCompare(a.date))
  posts.value = list
  loading.value = false
}

onMounted(() => {
  if (route.query.topic) activeTopic.value = `#${route.query.topic}`
  load()
})

watch(activeTopic, load)
watch(sort, load)

function toggleTopic(t: string) {
  activeTopic.value = activeTopic.value === t ? '' : t
}

async function publish() {
  pubErr.value = ''
  if (!pubTitle.value.trim() || !pubContent.value.trim()) {
    pubErr.value = '标题和正文不能为空'
    return
  }
  showPublish.value = false
  userStore.toast('已提交，审核通过后将展示在社区（Mock）')
  pubTitle.value = ''
  pubContent.value = ''
}
</script>

<template>
  <div class="comm-page">
    <div class="head container">
      <div class="head-text">
        <em>SHEQU · COMMUNITY</em>
        <h1 class="h-display">把乌东讲给世界听</h1>
        <p>游记 · 攻略 · 相遇 —— 每一帧都是苗寨的心跳</p>
      </div>
      <button class="btn btn-primary btn-lg publish-btn" @click="userStore.isLoggedIn ? (showPublish = true) : userStore.toast('请先登录后发布')">
        <AppIcon name="camera" :size="17" /> 发布游记
      </button>
    </div>

    <div class="container layout">
      <main>
        <div class="toolbar">
          <div class="topics">
            <button
              :class="{ on: !activeTopic }"
              @click="activeTopic = ''"
            >
              全部
            </button>
            <button
              v-for="t in topics"
              :key="t"
              :class="{ on: activeTopic === t }"
              @click="toggleTopic(t)"
            >
              {{ t }}
            </button>
          </div>
          <div class="sorts">
            <button :class="{ on: sort === 'hot' }" @click="sort = 'hot'">最热</button>
            <button :class="{ on: sort === 'new' }" @click="sort = 'new'">最新</button>
          </div>
        </div>

        <EmptyState v-if="!loading && !posts.length" text="这个话题下还没有游记" />
        <div v-else class="waterfall">
          <PostCard v-for="(p, i) in posts" :key="p.id" :item="p" class="rise" :style="{ animationDelay: `${Math.min(i, 8) * 50}ms` }" />
        </div>
      </main>

      <aside class="side">
        <div class="side-card">
          <h4>活跃村民</h4>
          <div v-for="u in hotUsers" :key="u.id" class="u-row">
            <img :src="u.avatar" :alt="u.name" />
            <div>
              <b>{{ u.name }}</b>
              <span>{{ u.bio }}</span>
            </div>
            <i>{{ u.likes }} 赞</i>
          </div>
        </div>

        <div class="side-card pub-card">
          <img :src="publishImg" alt="" />
          <h4>今日发布灵感</h4>
          <p>「在乌东，你遇到的最意外的一件事是什么？」</p>
        </div>
      </aside>
    </div>

    <!-- 发布弹窗 -->
    <transition name="pop">
      <div v-if="showPublish" class="modal-mask" @click.self="showPublish = false">
        <div class="modal">
          <header>
            <h3>发布游记</h3>
            <button class="close" @click="showPublish = false"><AppIcon name="close" :size="18" /></button>
          </header>
          <div class="field">
            <label>标题</label>
            <input v-model="pubTitle" maxlength="30" placeholder="一句话讲出你的乌东故事" />
          </div>
          <div class="field">
            <label>话题</label>
            <select v-model="pubTopic">
              <option v-for="t in topics" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="field">
            <label>正文</label>
            <textarea v-model="pubContent" rows="5" maxlength="5000" placeholder="文字会记录下照片装不下的部分…（图片上传功能待后端就绪）"></textarea>
          </div>
          <p v-if="pubErr" class="err">{{ pubErr }}</p>
          <p class="hint">发布内容将经过内容安全审核（机审 + 人工复审）</p>
          <button class="btn btn-primary btn-lg" style="width: 100%" @click="publish">提交发布</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 48px 0 8px;
}

.head-text em {
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.5em;
  color: var(--accent);
}

.head-text h1 {
  font-size: clamp(24px, 3.4vw, 36px);
  margin-top: 8px;
}

.head-text p {
  margin-top: 8px;
  color: var(--text-2);
  font-size: 13.5px;
  letter-spacing: 0.15em;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 270px;
  gap: 34px;
  padding-top: 26px;
  align-items: start;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.topics {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.topics button {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  font-size: 13px;
  color: var(--text-2);
  background: #fff;
  transition: all 0.2s;
}

.topics button.on {
  background: var(--indigo);
  border-color: var(--indigo);
  color: var(--silver-light);
  font-weight: 600;
}

.sorts {
  display: flex;
  gap: 4px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 3px;
}

.sorts button {
  padding: 5px 16px;
  font-size: 13px;
  border-radius: 4px;
  color: var(--text-2);
}

.sorts button.on {
  background: var(--indigo);
  color: var(--silver-light);
}

.waterfall {
  columns: 3 240px;
  column-gap: 16px;
}

.side {
  position: sticky;
  top: 84px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.side-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.side-card h4 {
  font-size: 13px;
  letter-spacing: 0.25em;
  color: var(--text-3);
  margin-bottom: 14px;
  font-weight: 500;
}

.u-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 8px 0;
}

.u-row img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.u-row b {
  display: block;
  font-size: 13.5px;
}

.u-row span {
  font-size: 11.5px;
  color: var(--text-3);
}

.u-row i {
  margin-left: auto;
  font-style: normal;
  font-size: 11.5px;
  color: var(--amber);
  font-weight: 600;
}

.pub-card img {
  border-radius: var(--radius);
  aspect-ratio: 4/3;
  object-fit: cover;
  margin-bottom: 12px;
}

.pub-card p {
  font-size: 13px;
  line-height: 1.9;
  color: var(--text-2);
  font-family: var(--font-display);
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 35, 56, 0.55);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal {
  width: min(480px, 100%);
  background: var(--paper);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  border-top: 4px solid var(--accent);
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal h3 {
  font-family: var(--font-display);
}

.close {
  color: var(--text-3);
}

.close:hover {
  color: var(--accent);
}

.field {
  margin-bottom: 14px;
}

.err {
  color: var(--accent);
  font-size: 12.5px;
  margin-bottom: 10px;
}

.hint {
  font-size: 11.5px;
  color: var(--text-3);
  margin-bottom: 14px;
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.25s;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

@media (max-width: 1023px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .side {
    position: static;
    flex-direction: row;
  }

  .side-card {
    flex: 1;
  }
}

@media (max-width: 599px) {
  .side {
    flex-direction: column;
  }

  .head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
