import { defineStore } from 'pinia'
import * as api from '@/api'

type CompositeKey = `${string}:${string | number}`

function key(targetType: string, id: string | number): CompositeKey {
  return `${targetType}:${id}`
}

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    ids: new Set<CompositeKey>(),
  }),
  actions: {
    async toggle(targetType: string, id: string | number): Promise<boolean> {
      const res = await api.toggleFavorite(targetType, id)
      if (res.data.favorited) this.ids.add(key(targetType, id))
      else this.ids.delete(key(targetType, id))
      return res.data.favorited
    },
  },
})