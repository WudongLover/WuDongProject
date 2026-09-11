import type { Message } from '@/types'
import type { Envelope } from './contracts'
import { apiFetch } from './http'

export const messageApi = {
  list: () => apiFetch<Envelope<Message[]>>('/user/messages'),
  markRead: (id: string) =>
    apiFetch<Envelope<boolean>>(`/user/messages/${id}/read`, {
      method: 'PUT',
    }),
  markAllRead: () =>
    apiFetch<Envelope<{ affected: number }>>('/user/messages/read-all', {
      method: 'PUT',
    }),
  unreadCount: () =>
    apiFetch<Envelope<{ count: number }>>('/user/messages/unread-count'),
}
