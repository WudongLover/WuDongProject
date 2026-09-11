<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api'
import { unwrapError } from '@/api'
import type { FollowUser, Post, PublicUserProfile } from '@/types'
import { useUserStore } from '@/stores/user'
import EmptyState from '@/components/EmptyState.vue'
import AppIcon from '@/components/AppIcon.vue'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const notFound = ref(false)
const profile = ref<PublicUserProfile | null>(null)
const posts = ref<Post[]>([])
const following = ref<FollowUser[]>([])
const followers = ref<FollowUser[]>([])
type Tab = 'posts' | 'following' | 'followers'
const tab = ref<Tab>(normalizeTab(route.query.tab))

const userId = computed(() => String(route.params.id || ''))
const isSelf = computed(() => !!profile.value && profile.value.id === userStore.user?.id)

function normalizeTab(value: unknown): Tab {
  return value === 'following' || value === 'followers' ? value : 'posts'
}

function setTab(next: Tab) {
  tab.value = next
  router.replace({ query: { ...route.query, tab: next } })
}

async function load() {
  if (!userId.value) return
  loading.value = true
  notFound.value = false
  try {
    const [profileRes, postsRes, followingRes, followersRes] = await Promise.all([
      api.userProfileApi.get(userId.value),
      api.userProfileApi.posts(userId.value),
      api.userProfileApi.following(userId.value),
      api.userProfileApi.followers(userId.value),
    ])
    if (!profileRes.data) {
      notFound.value = true
      return
    }
    profile.value = profileRes.data
    posts.value = postsRes.data
    following.value = followingRes.data
    followers.value = followersRes.data
  } catch (e) {
    notFound.value = true
    userStore.toast(unwrapError(e).message)
  } finally {
    loading.value = false
  }
}

async function toggleFollow() {
  if (!profile.value || isSelf.value) return
  if (!userStore.requireLogin()) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    const res = await api.userProfileApi.toggleFollow(profile.value.id)
    profile.value.isFollowing = res.data.following
    profile.value.followerCount += res.data.following ? 1 : -1
    userStore.toast(res.data.following ? '已关注' : '已取消关注')
  } catch (e) {
    userStore.toast(unwrapError(e).message)
  }
}

watch(userId, load, { immediate: true })
watch(
  () => route.query.tab,
  (value) => (tab.value = normalizeTab(value)),
)
</script>

<template>
  <div class="public-user container">
    <EmptyState v-if="notFound" text="用户不存在">
      <router-link to="/community" class="btn btn-outline">返回社区</router-link>
    </EmptyState>

    <template v-else-if="profile">
      <section class="user-hero">
        <img :src="profile.avatar" :alt="profile.name" />
        <div class="user-main">
          <h1>{{ profile.name }}</h1>
          <p>{{ profile.bio || '这个人很懒，什么都没写' }}</p>
        </div>
        <router-link v-if="isSelf" to="/user" class="btn btn-outline">编辑资料</router-link>
        <button v-else class="btn" :class="profile.isFollowing ? 'btn-outline' : 'btn-primary'" @click="toggleFollow">
          {{ profile.isFollowing ? '已关注' : '+ 关注' }}
        </button>
      </section>

      <section class="user-stats">
        <div><b>{{ profile.postCount }}</b><span>游记</span></div>
        <div><b>{{ profile.likesReceived }}</b><span>获赞</span></div>
        <div><b>{{ profile.followingCount }}</b><span>关注</span></div>
        <div><b>{{ profile.followerCount }}</b><span>粉丝</span></div>
      </section>

      <div class="tabs">
        <button :class="{ on: tab === 'posts' }" @click="setTab('posts')">
          <AppIcon name="camera" :size="15" /> 游记
        </button>
        <button :class="{ on: tab === 'following' }" @click="setTab('following')">
          <AppIcon name="user" :size="15" /> 关注
        </button>
        <button :class="{ on: tab === 'followers' }" @click="setTab('followers')">
          <AppIcon name="heart" :size="15" /> 粉丝
        </button>
      </div>

      <section v-if="tab === 'posts'" class="content">
        <EmptyState v-if="!posts.length" text="还没有发布游记" />
        <div v-else class="post-grid">
          <PostCard v-for="post in posts" :key="post.id" :item="post" />
        </div>
      </section>

      <section v-else class="content">
        <EmptyState v-if="!(tab === 'following' ? following : followers).length" text="暂无用户" />
        <div v-else class="user-list">
          <router-link
            v-for="item in tab === 'following' ? following : followers"
            :key="item.id"
            :to="`/users/${item.id}`"
            class="user-row"
          >
            <img :src="item.avatar" :alt="item.name" />
            <div>
              <b>{{ item.name }}</b>
              <span>{{ item.bio || '这个人很懒，什么都没写' }}</span>
            </div>
            <AppIcon name="arrow" :size="16" />
          </router-link>
        </div>
      </section>
    </template>

    <div v-else-if="loading" class="loading">加载中...</div>
  </div>
</template>

<style scoped>
.public-user {
  padding-top: 32px;
  min-height: 50vh;
}

.user-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 30px;
  border-radius: var(--radius-lg);
  background: var(--indigo-deep);
  color: var(--silver-light);
}

.user-hero > img {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(215, 224, 230, 0.4);
  flex: none;
}

.user-main {
  flex: 1;
  min-width: 0;
}

.user-main h1 {
  font-family: var(--font-display);
  font-size: 24px;
}

.user-main p {
  margin-top: 5px;
  color: rgba(215, 224, 230, 0.72);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #fff;
  border: 1px solid var(--line);
  border-top: 0;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;
}

.user-stats div {
  text-align: center;
  padding: 16px 10px;
  border-right: 1px solid var(--line);
}

.user-stats div:last-child {
  border-right: 0;
}

.user-stats b {
  display: block;
  color: var(--primary);
  font-size: 20px;
}

.user-stats span {
  color: var(--text-3);
  font-size: 12px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin: 22px 0 16px;
}

.tabs button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  color: var(--text-2);
}

.tabs button.on {
  border-color: var(--indigo);
  background: var(--indigo);
  color: var(--silver-light);
}

.post-grid {
  columns: 3 260px;
  column-gap: 16px;
}

.user-list {
  display: grid;
  gap: 10px;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: #fff;
}

.user-row img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-row div {
  flex: 1;
  min-width: 0;
}

.user-row b {
  display: block;
}

.user-row span {
  display: block;
  margin-top: 3px;
  color: var(--text-3);
  font-size: 12.5px;
}

.loading {
  padding: 80px 0;
  text-align: center;
  color: var(--text-3);
}

@media (max-width: 767px) {
  .user-hero {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .user-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-stats div:nth-child(2) {
    border-right: 0;
  }

  .user-stats div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--line);
  }
}
</style>
