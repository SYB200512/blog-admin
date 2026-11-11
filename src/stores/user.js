import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
  }),
  getters: {
    isLogin: (state) => !!state.token,
  },
  actions: {
    // 登录
    async login(username, password) {
      const data = await loginApi({ username, password })
      this.token = data.access_token
      this.userInfo = data.user
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('userInfo', JSON.stringify(data.user))
    },
    // 退出登录：先通知服务端注销当前设备会话，再清理本地状态
    async logout() {
      try {
        await logoutApi()
      } catch {
        // 会话已失效时接口可能返回 401，本地状态仍需清理
      }
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('tokenExpiresAt')
    },
  },
})
