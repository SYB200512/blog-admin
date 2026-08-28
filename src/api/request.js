import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// 请求拦截器：附加 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理业务码
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 非 JSON 响应直接返回
    if (res.code === undefined) return res
    if (res.code === 0) return res.data
    // 未认证：清除 token 并跳转登录
    if (res.code === 4001) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default request
