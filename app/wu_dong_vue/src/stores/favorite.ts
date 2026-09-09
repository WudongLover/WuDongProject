import { defineStore } from 'pinia'
import * as api from '@/api'

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    ids: new Set<string | number>(),
  }),
  actions: {
    sync(id: string | number) {
      this.ids = new Set([...this.ids, id])
    },
    has(id: string | number): boolean {
      return this.ids.has(id)
    },
    async toggle(id: string | number): Promise<boolean> {
      const res = await api.toggleFavorite(String(id))
      if (res.data.favorited) this.ids.add(id)
      else this.ids.delete(id)
      return res.data.favorited
    },
  },
})
