import request from './request'

// 上传图片（FormData），大图需要更长的超时时间
export function uploadImage(file, category) {
  const form = new FormData()
  form.append('image', file)
  if (category) form.append('category', category)
  return request.post('/admin/images/upload', form, { timeout: 60000 })
}

// 图片列表
export function getImages(params) {
  return request.get('/admin/images', { params })
}

// 批量删除图片
export function deleteImages(ids) {
  return request.delete('/admin/images', { data: { ids } })
}

// 批量修改图片分类
export function updateImageCategory(ids, category) {
  return request.put('/admin/images/category', { ids, category })
}
