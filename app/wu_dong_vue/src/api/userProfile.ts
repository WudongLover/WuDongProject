import type { FollowUser, Post, PublicUserProfile } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

export const userProfileApi = {
  get: (id: string) => apiFetch<Envelope<PublicUserProfile | null>>(`/users/${id}`),
  posts: (id: string) => apiFetch<Envelope<Post[]>>(`/users/${id}/posts`),
  following: (id: string) => apiFetch<Envelope<FollowUser[]>>(`/users/${id}/following`),
  followers: (id: string) => apiFetch<Envelope<FollowUser[]>>(`/users/${id}/followers`),
  toggleFollow: (id: string) =>
    apiFetch<Envelope<{ following: boolean }>>(`/users/${id}/follow`, {
      method: 'PUT',
    }),
}
