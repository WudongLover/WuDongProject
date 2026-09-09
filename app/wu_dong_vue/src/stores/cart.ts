import { defineStore } from 'pinia'
import * as api from '@/api'
import { cartApi } from '@/api/cart'
import type { CartItem, Order } from '@/types'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    loaded: false,
  }),
  getters: {
    count: (s) => s.items.reduce((n, c) => n + c.qty, 0),
    checkedItems: (s) => s.items.filter((c) => c.checked === true),
    checkedTotal(): number {
      return this.checkedItems.reduce((n, c) => n + c.price * c.qty, 0)
    },
  },
  actions: {
    /** 归一化后端返回：checked 兼容 0/1/'1'/布尔，金额数量转 number */
    normalize(items: CartItem[]): CartItem[] {
      return items.map((item) => ({
        ...item,
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 0,
        stock: Number(item.stock) || 0,
        checked:
          item.checked === true ||
          (item.checked as unknown) === 1 ||
          (item.checked as unknown) === '1' ||
          (item.checked as unknown) === 'true',
      }))
    },
    async load() {
      const res = await cartApi.list()
      this.items = this.normalize(res.data)
      this.loaded = true
    },
    async add(payload: {
      productId: string
      skuId?: string
      title: string
      cover: string
      sku: string
      price: number
      qty: number
      stock: number
      shop: string
    }) {
      const res = await cartApi.add({
        productId: payload.productId,
        skuId: payload.skuId,
        qty: payload.qty,
        shop: payload.shop,
      })
      this.items = this.normalize(res.data)
    },
    async updateQty(id: string, qty: number) {
      const item = this.items.find((entry) => entry.id === id)
      const previous = item?.qty
      if (item) item.qty = qty
      try {
        const res = await cartApi.update(id, { qty })
        this.items = this.normalize(res.data)
      } catch (error) {
        if (item && previous !== undefined) item.qty = previous
        throw error
      }
    },
    async toggleChecked(id: string, checked: boolean) {
      const item = this.items.find((entry) => entry.id === id)
      const previous = item?.checked
      if (item) item.checked = checked
      try {
        const res = await cartApi.update(id, { checked })
        this.items = this.normalize(res.data)
      } catch (error) {
        if (item && previous !== undefined) item.checked = previous
        throw error
      }
    },
    async remove(id: string) {
      const res = await cartApi.remove(id)
      this.items = this.normalize(res.data)
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
