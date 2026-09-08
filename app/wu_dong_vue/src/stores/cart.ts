import { defineStore } from 'pinia'
import * as api from '@/api'
import type { CartItem } from '@/types'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    loaded: false,
  }),
  getters: {
    count: (s) => s.items.reduce((n, c) => n + c.qty, 0),
    checkedItems: (s) => s.items.filter((c) => c.checked),
    checkedTotal(): number {
      return this.checkedItems.reduce((n, c) => n + c.price * c.qty, 0)
    },
  },
  actions: {
    async load() {
      const res = await api.getCart()
      this.items = res.data
      this.loaded = true
    },
    async add(payload: { productId: string; title: string; cover: string; sku: string; price: number; qty: number; stock: number; shop: string }) {
      const res = await api.addToCart(payload)
      this.items = res.data
    },
    async updateQty(id: string, qty: number) {
      const res = await api.updateCartItem(id, { qty })
      this.items = res.data
    },
    async toggleChecked(id: string, checked: boolean) {
      const res = await api.updateCartItem(id, { checked })
      this.items = res.data
    },
    async remove(id: string) {
      const res = await api.removeCartItem(id)
      this.items = res.data
    },
    async checkout(): Promise<Order> {
      const ids = this.checkedItems.map((c) => c.id)
      const shops = [...new Set(this.checkedItems.map((c) => c.shop))]
      const amount = this.checkedTotal
      const res = await api.createOrder({
        type: 'GOODS',
        title: shops.length > 1 ? `${shops[0]} 等 ${shops.length} 家店铺` : shops[0] || '乌东集市',
        cover: this.checkedItems[0]?.cover || '',
        summary: this.checkedItems.map((c) => `${c.title} × ${c.qty}`).join('；'),
        amount,
        qty: this.checkedItems.reduce((n, c) => n + c.qty, 0),
        shop: shops[0] || '乌东集市',
        cartItemIds: ids,
      })
      await this.load()
      return res.data
    },
  },
})
