import request from './request'

// 标签列表
export function getTags() {
  return request.get('/tags')
}

// 创建标签
export function createTag(data) {
  return request.post('/admin/tags', data)
}

// 删除标签
export function deleteTag(id) {
  return request.delete(`/admin/tags/${id}`)
}
