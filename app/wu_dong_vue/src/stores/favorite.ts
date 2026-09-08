import { defineStore } from 'pinia'
import * as api from '@/api'

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    ids: new Set<string>(),
  }),
  actions: {
    sync(id: string) {
      this.ids = new Set([...this.ids, id])
    },
    has(id: string): boolean {
      return this.ids.has(id)
    },
    async toggle(id: string): Promise<boolean> {
      const res = await api.toggleFavorite(id)
      if (res.data.favorited) this.ids.add(id)
      else this.ids.delete(id)
      return res.data.favorited
    },
  },
})
