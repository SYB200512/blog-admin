import request from './request'

// 分类列表
export function getCategories() {
  return request.get('/categories')
}

// 创建分类
export function createCategory(data) {
  return request.post('/admin/categories', data)
}

// 更新分类
export function updateCategory(id, data) {
  return request.put(`/admin/categories/${id}`, data)
}

// 删除分类
export function deleteCategory(id) {
  return request.delete(`/admin/categories/${id}`)
}
