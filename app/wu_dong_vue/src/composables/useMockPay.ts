/**
 * 下单后立即弹虚拟支付：把「下单 → 弹窗支付 → 结果页」的公共逻辑收敛在一处，
 * 供购物车结算、商品立即购买、门票/路线/民宿预订共用。
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Order } from '@/types'
import { useUserStore } from '@/stores/user'

export function useMockPay() {
  const router = useRouter()
  const userStore = useUserStore()
  /** 待支付订单；非空即弹窗展示 */
  const pendingOrder = ref<Order | null>(null)

  /** 下单成功后调用：弹出虚拟支付 */
  function askPay(order: Order) {
    pendingOrder.value = order
  }

  /** 支付成功：进下单成功页 */
  function onPaid(order: Order) {
    pendingOrder.value = null
    router.push(`/order/result/${order.orderNo}`)
  }

  /** 暂不支付：关掉弹窗，订单保留为待支付，可在我的订单里取消 */
  function onDismiss(order: Order) {
    pendingOrder.value = null
    userStore.toast('订单已保留为待支付')
    router.push({ path: '/orders', query: { highlight: order.orderNo } })
  }

  return { pendingOrder, askPay, onPaid, onDismiss }
}
