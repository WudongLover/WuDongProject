import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    { path: '/goods', name: 'goods', component: () => import('@/views/GoodsListView.vue') },
    { path: '/product/:id', name: 'product', component: () => import('@/views/ProductDetailView.vue') },
    { path: '/food', name: 'food', component: () => import('@/views/FoodView.vue') },
    { path: '/restaurants/:id', name: 'restaurant', component: () => import('@/views/RestaurantDetailView.vue') },
    { path: '/stay', name: 'stay', component: () => import('@/views/StayView.vue') },
    { path: '/stay/:id', name: 'homestay', component: () => import('@/views/StayDetailView.vue') },
    { path: '/trip', name: 'trip', component: () => import('@/views/TripView.vue') },
    { path: '/routes/:id', name: 'route', component: () => import('@/views/TripDetailView.vue') },
    { path: '/community', name: 'community', component: () => import('@/views/CommunityView.vue') },
    { path: '/posts/:id', name: 'post', component: () => import('@/views/PostDetailView.vue') },
    { path: '/culture/:id', name: 'culture', component: () => import('@/views/CultureDetailView.vue') },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    { path: '/cart', name: 'cart', component: () => import('@/views/CartView.vue') },
    { path: '/orders', name: 'orders', component: () => import('@/views/OrdersView.vue') },
    { path: '/user', name: 'user', component: () => import('@/views/UserView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
