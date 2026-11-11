import request from './request'

// 登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 获取当前用户信息
export function getProfile() {
  return request.get('/auth/profile')
}

// 退出登录：服务端删除当前设备的 refresh 会话并清 Cookie
export function logout() {
  return request.post('/auth/logout')
}
