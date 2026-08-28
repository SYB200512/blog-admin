import request from './request'

// 评论列表
export function getComments(params) {
  return request.get('/admin/comments', { params })
}

// 审核评论
export function reviewComment(id, status) {
  return request.put(`/admin/comments/${id}`, { status })
}
