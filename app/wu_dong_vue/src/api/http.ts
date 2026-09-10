/**
 * HTTP 客户端：基于 axios，统一拦截器与错误处理。
 * Vite proxy 已将 /api 转发到后端（localhost:6666）。
 */
import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.msg ||
      error.message ||
      '网络异常'
    return Promise.reject(new Error(message))
  }
)

export default http