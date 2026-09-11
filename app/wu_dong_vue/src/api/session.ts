/**
 * 401 统一出口。
 *
 * http.ts 需要"清登录态 + 跳登录页"，但不能直接依赖 Pinia store 或 router
 * （stores/user 依赖 @/api，直接引用会形成循环依赖）。因此这里只做一个
 * 无依赖的回调槽，由应用入口（main.ts）注册真正的处理逻辑。
 */
type UnauthorizedHandler = (info: { path: string }) => void

let handler: UnauthorizedHandler | null = null

export function onUnauthorized(cb: UnauthorizedHandler) {
  handler = cb
}

export function emitUnauthorized(path: string) {
  handler?.({ path })
}
