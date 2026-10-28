<template>
  <el-card shadow="never">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-select v-model="filters.category" placeholder="全部分类" clearable style="width: 140px" @change="handleSearch">
        <el-option v-for="c in CATEGORIES" :key="c" :label="c" :value="c" />
      </el-select>
      <el-input v-model="filters.keyword" placeholder="按文件名搜索" clearable style="width: 200px"
        @keyup.enter="handleSearch" @clear="handleSearch" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>

      <div class="toolbar-right">
        <span v-if="selectedIds.length" class="selected-tip">已选 {{ selectedIds.length }} 张</span>
        <el-select v-if="selectedIds.length" v-model="batchCategory" placeholder="修改分类" style="width: 120px"
          @change="handleBatchCategory">
          <el-option v-for="c in CATEGORIES.filter((i) => i !== '未使用')" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button v-if="selectedIds.length" type="danger" plain @click="handleBatchDelete">批量删除</el-button>
        <el-select v-model="uploadCategory" placeholder="上传分类" style="width: 120px">
          <el-option v-for="c in CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
        <el-upload :show-file-list="false" :http-request="handleUpload" multiple accept="image/*">
          <el-button type="primary">
            <el-icon style="margin-right: 4px"><Upload /></el-icon>
            上传图片
          </el-button>
        </el-upload>
      </div>
    </div>

    <!-- 图片网格 -->
    <div v-loading="loading" class="grid">
      <div v-for="item in images" :key="item.id" class="image-card"
        :class="{ active: selectedIds.includes(item.id) }">
        <div class="thumb">
          <img :src="item.url" :alt="item.name" loading="lazy" />
          <el-checkbox class="picker" :model-value="selectedIds.includes(item.id)"
            @change="toggleSelect(item.id)" />
          <div class="thumb-actions">
            <el-button size="small" circle @click.stop="copyUrl(item.url)">
              <el-icon><Link /></el-icon>
            </el-button>
            <el-button size="small" type="danger" circle @click.stop="handleDelete(item)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="meta">
          <div class="name" :title="item.name">{{ item.name }}</div>
          <div class="tags">
            <el-tag size="small" :type="categoryType(item.category)">{{ item.category }}</el-tag>
            <el-tag size="small" type="info">{{ item.storage }}</el-tag>
          </div>
          <div class="sub">{{ formatSize(item.size) }} · {{ formatDate(item.created_at) }}</div>
        </div>
      </div>

      <el-empty v-if="!loading && !images.length" description="还没有图片，点右上角上传" style="grid-column: 1/-1" />
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="filters.page_size"
        :current-page="filters.page" @current-change="handlePageChange" />
    </div>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getImages, uploadImage, deleteImages, updateImageCategory } from '@/api/image'
import { formatDate } from '@/utils/format'

const CATEGORIES = ['未使用', '封面', '插图', '头像', '图片墙', '系统']

const images = ref([])
const total = ref(0)
const loading = ref(false)
const selectedIds = ref([])
// 上传时选择的分类：图片墙的图片会直接出现在前台 /photos 页面
const uploadCategory = ref('未使用')
// 选中图片后批量改分类
const batchCategory = ref('')

const filters = reactive({
  page: 1,
  page_size: 20,
  category: '',
  keyword: '',
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getImages({ ...filters })
    images.value = res.list || []
    total.value = res.total || 0
    // 过滤掉本页已不存在的选中项
    const ids = new Set(images.value.map((i) => i.id))
    selectedIds.value = selectedIds.value.filter((id) => ids.has(id))
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  filters.page = 1
  loadData()
}

const handlePageChange = (page) => {
  filters.page = page
  loadData()
}

// 上传：逐张上传，全部完成后刷新列表
const handleUpload = async ({ file }) => {
  try {
    await uploadImage(file, uploadCategory.value)
    ElMessage.success(`${file.name} 上传成功`)
    filters.page = 1
    loadData()
  } catch (e) {
    // 拦截器已提示错误
  }
}

const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

const copyUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('图片地址已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制：' + url)
  }
}

const handleDelete = async (item) => {
  await ElMessageBox.confirm(`确定删除图片 ${item.name} 吗？存储中的文件也会一并删除。`, '提示', { type: 'warning' })
  await deleteImages([item.id])
  ElMessage.success('删除成功')
  selectedIds.value = selectedIds.value.filter((id) => id !== item.id)
  loadData()
}

const handleBatchDelete = async () => {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 张图片吗？`, '提示', { type: 'warning' })
  await deleteImages([...selectedIds.value])
  ElMessage.success('删除成功')
  selectedIds.value = []
  loadData()
}

// 批量修改分类（例如把已上传的图设为「图片墙」直接上前台）
const handleBatchCategory = async (category) => {
  await updateImageCategory([...selectedIds.value], category)
  ElMessage.success(`已改为「${category}」`)
  batchCategory.value = ''
  loadData()
}

const categoryType = (category) => {
  switch (category) {
    case '封面':
      return 'success'
    case '插图':
      return 'warning'
    case '头像':
    case '系统':
      return 'info'
    default:
      return ''
  }
}

const formatSize = (bytes) => {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

onMounted(loadData)
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-tip {
  color: #409eff;
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.image-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.image-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.image-card.active {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

.thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #f5f7fa;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.picker {
  position: absolute;
  top: 6px;
  left: 8px;
}

.thumb-actions {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .thumb-actions {
  opacity: 1;
}

.meta {
  padding: 10px;
}

.name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tags {
  display: flex;
  gap: 6px;
  margin: 6px 0;
}

.sub {
  font-size: 12px;
  color: #999;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
