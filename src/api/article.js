import request from './request'

// 文章列表
export function getArticles(params) {
  return request.get('/admin/articles', { params })
}

// 文章详情
export function getArticle(id) {
  return request.get(`/admin/articles/${id}`)
}

// 创建文章
export function createArticle(data) {
  return request.post('/admin/articles', data)
}

// 更新文章
export function updateArticle(id, data) {
  return request.put(`/admin/articles/${id}`, data)
}

// 删除文章
export function deleteArticle(id) {
  return request.delete(`/admin/articles/${id}`)
}
