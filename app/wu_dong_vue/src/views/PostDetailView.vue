<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as api from '@/api'
import type { Post } from '@/types'
import { useUserStore } from '@/stores/user'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const userStore = useUserStore()

const post = ref<Post | null>(null)
const notFound = ref(false)
const liked = ref(false)
const likes = ref(0)
const collected = ref(false)
const commentText = ref('')
const sending = ref(false)

onMounted(async () => {
  try {
    const res = await api.getPostDetail(route.params.id as string)
    post.value = res.data
    liked.value = !!res.data.liked
    likes.value = res.data.likes
  } catch {
    notFound.value = true
  }
})

async function doLike() {
  if (!userStore.requireLogin()) return
  const res = await api.togglePostLike(post.value!.id)
  liked.value = res.data.liked
  likes.value = res.data.likes
}

function doCollect() {
  collected.value = !collected.value
  userStore.toast(collected.value ? '已收藏游记' : '已取消收藏')
}

function share() {
  userStore.toast('链接已复制（Mock）')
}

async function sendComment() {
  if (!commentText.value.trim()) return
  if (!userStore.requireLogin()) return
  sending.value = true
  try {
    const res = await api.addComment(post.value!.id, commentText.value)
    post.value!.comments = res.data as typeof post.value.comments
    commentText.value = ''
    userStore.toast('评论成功')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="post-page container">
    <EmptyState v-if="notFound" text="游记不存在或已被下架">
      <router-link to="/community" class="btn btn-outline">回到社区</router-link>
    </EmptyState>

    <template v-else-if="post">
      <nav class="crumbs">
        <router-link to="/">首页</router-link><span>/</span>
        <router-link to="/community">社区</router-link>
        <span v-if="post.topic">/</span>
        <b v-if="post.topic">{{ post.topic }}</b>
      </nav>

      <div class="layout">
        <article class="main">
          <h1>{{ post.title }}</h1>
          <div class="author-row">
            <img :src="post.author.avatar" :alt="post.author.name" />
            <div>
              <b>{{ post.author.name }}</b>
              <span>{{ post.author.bio }}</span>
            </div>
            <time>{{ post.date }}</time>
          </div>

          <div class="imgs" :class="{ single: post.images.length === 1 }">
            <img
              v-for="(im, i) in post.images"
              :key="i"
              :src="im"
              :alt="`${post.title} 图 ${i + 1}`"
              loading="lazy"
            />
          </div>

          <p class="content">{{ post.content }}</p>

          <div class="meta-row">
            <span v-if="post.topic" class="tag tag-solid">{{ post.topic }}</span>
            <span v-if="post.place" class="tag"><AppIcon name="location" :size="12" /> {{ post.place }}</span>
            <span class="views"><AppIcon name="eye" :size="14" /> {{ post.views }} 阅读</span>
          </div>

          <div class="action-bar">
            <button :class="{ on: liked }" @click="doLike">
              <AppIcon name="heart" :size="18" />
              {{ likes }}
            </button>
            <button :class="{ on: collected }" @click="doCollect">
              <AppIcon name="star" :size="18" />
              {{ post.collects + (collected ? 1 : 0) }}
            </button>
            <button @click="share">
              <AppIcon name="arrow" :size="18" />
              分享
            </button>
          </div>

          <!-- 评论区 -->
          <section class="comments">
            <h3>评论（{{ post.comments.length }}）</h3>

            <div class="c-input">
              <img :src="userStore.user?.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%23dfe6ee%22/%3E%3C/svg%3E'" alt="" />
              <input
                v-model="commentText"
                maxlength="500"
                placeholder="说点什么…"
                @keyup.enter="sendComment"
              />
              <button class="btn btn-primary" :disabled="sending" @click="sendComment">发送</button>
            </div>

            <EmptyState v-if="!post.comments.length" text="还没有评论，抢个沙发" />
            <div v-for="c in post.comments" :key="c.id" class="comment">
              <img :src="c.avatar" :alt="c.user" />
              <div class="c-body">
                <div class="c-head">
                  <b>{{ c.user }}</b>
                  <time>{{ c.date }}</time>
                </div>
                <p>{{ c.content }}</p>
                <div v-for="(r, i) in c.replies" :key="i" class="c-reply">
                  <b>{{ r.user }}</b>：{{ r.content }}
                </div>
              </div>
            </div>
          </section>
        </article>

        <aside class="side">
          <div class="author-card">
            <img :src="post.author.avatar" :alt="post.author.name" />
            <b>{{ post.author.name }}</b>
            <span>{{ post.author.bio }}</span>
            <button class="btn btn-outline">+ 关注</button>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.post-page {
  padding-top: 26px;
}

.crumbs {
  display: flex;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-3);
  margin-bottom: 20px;
}

.crumbs b { color: var(--text-2); font-weight: 500; }
.crumbs a:hover { color: var(--primary); }

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 40px;
  align-items: start;
}

.main h1 {
  font-family: var(--font-display);
  font-size: clamp(22px, 3vw, 32px);
  color: var(--ink);
  line-height: 1.5;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.author-row img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.author-row b {
  display: block;
  font-size: 14.5px;
}

.author-row span {
  font-size: 12px;
  color: var(--text-3);
}

.author-row time {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--text-3);
}

.imgs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.imgs.single {
  grid-template-columns: 1fr;
}

.imgs img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: var(--radius);
  transition: transform 0.4s var(--ease);
}

.imgs.single img {
  aspect-ratio: auto;
  max-height: 520px;
}

.imgs img:hover {
  transform: scale(1.015);
}

.content {
  margin-top: 24px;
  font-size: 15.5px;
  line-height: 2.2;
  color: var(--text);
  white-space: pre-wrap;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.views {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-3);
}

.action-bar {
  display: flex;
  gap: 26px;
  margin-top: 26px;
  padding: 16px 0;
  border-block: 1px solid var(--line);
}

.action-bar button {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14.5px;
  color: var(--text-2);
  transition: all 0.2s;
  letter-spacing: 0.05em;
}

.action-bar button:hover {
  color: var(--primary);
}

.action-bar button.on {
  color: var(--accent);
  font-weight: 700;
}

.action-bar button.on :deep(svg) {
  fill: rgba(181, 68, 46, 0.15);
}

.comments {
  margin-top: 30px;
}

.comments h3 {
  font-family: var(--font-display);
  font-size: 18px;
  margin-bottom: 18px;
}

.c-input {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
}

.c-input img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.c-input input {
  flex: 1;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 10px 18px;
  background: #fff;
  transition: all 0.2s;
}

.c-input input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(35, 69, 107, 0.12);
}

.comment {
  display: flex;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px dashed var(--line);
}

.comment > img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
}

.c-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.c-head b {
  font-size: 13.5px;
}

.c-head time {
  font-size: 11.5px;
  color: var(--text-3);
}

.c-body p {
  margin-top: 5px;
  font-size: 14px;
  line-height: 1.9;
}

.c-reply {
  margin-top: 9px;
  background: var(--paper);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 12.5px;
  color: var(--text-2);
}

.c-reply b {
  color: var(--primary);
}

.side {
  position: sticky;
  top: 84px;
}

.author-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  text-align: center;
}

.author-card img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.author-card b {
  font-size: 15px;
}

.author-card span {
  font-size: 12px;
  color: var(--text-3);
}

.author-card .btn {
  margin-top: 10px;
  width: 100%;
}

@media (max-width: 1023px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .side {
    position: static;
  }

  .imgs {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
