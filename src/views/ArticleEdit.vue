<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span>{{ isEdit ? '编辑文章' : '写文章' }}</span>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </template>

    <el-form :model="form" label-width="80px">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="摘要">
        <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="文章摘要（可选，用于 SEO 描述）" maxlength="500" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category_id" placeholder="选择分类" clearable style="width: 220px">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="form.tag_ids" multiple placeholder="选择标签" style="width: 100%">
          <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="封面">
        <div class="cover-row">
          <el-input v-model="form.cover" placeholder="封面图 URL（可选）" />
          <el-button @click="openPicker">从图片库选择</el-button>
          <el-upload :show-file-list="false" :http-request="handleCoverUpload" accept="image/*">
            <el-button>上传封面</el-button>
          </el-upload>
        </div>
        <div v-if="form.cover" class="cover-preview">
          <img :src="form.cover" alt="封面预览" />
        </div>
      </el-form-item>
      <el-form-item label="置顶">
        <el-switch v-model="form.is_top" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="正文">
        <div class="content-wrap">
          <div class="content-toolbar">
            <el-button size="small" @click="openInserter">插入图片</el-button>
            <span class="content-tip">支持 Markdown 语法，图片会插入到光标位置</span>
          </div>
          <el-input ref="contentInput" v-model="form.content" type="textarea" :rows="18" placeholder="支持 Markdown 语法" />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave(1)">
          发布
        </el-button>
        <el-button :loading="saving" @click="handleSave(0)">存为草稿</el-button>
      </el-form-item>
    </el-form>

    <!-- 图片库选择封面 -->
    <el-dialog v-model="pickerVisible" title="从图片库选择封面" width="820px">
      <div v-loading="pickerLoading" class="picker-grid">
        <div v-for="img in pickerImages" :key="img.id" class="picker-item"
          :class="{ active: form.cover === img.url }" @click="chooseCover(img)">
          <img :src="img.url" :alt="img.name" loading="lazy" />
          <span class="picker-name" :title="img.name">{{ img.name }}</span>
        </div>
        <el-empty v-if="!pickerLoading && !pickerImages.length" description="图片库还没有图片，先去「图片管理」上传"
          style="grid-column: 1/-1" />
      </div>
    </el-dialog>

    <!-- 插入正文图片 -->
    <el-dialog v-model="insertVisible" title="插入正文图片" width="820px">
      <div class="insert-actions">
        <el-upload :show-file-list="false" :http-request="handleInsertUpload" accept="image/*">
          <el-button type="primary" size="small">上传并插入</el-button>
        </el-upload>
      </div>
      <div v-loading="insertLoading" class="picker-grid">
        <div v-for="img in insertImages" :key="img.id" class="picker-item" @click="insertImage(img.url)">
          <img :src="img.url" :alt="img.name" loading="lazy" />
          <span class="picker-name" :title="img.name">{{ img.name }}</span>
        </div>
        <el-empty v-if="!insertLoading && !insertImages.length" description="图片库还没有图片，可点上方上传并插入"
          style="grid-column: 1/-1" />
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getArticle, createArticle, updateArticle } from '@/api/article'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'
import { getImages, uploadImage } from '@/api/image'

const route = useRoute()
const router = useRouter()
const articleId = computed(() => route.params.id)

const isEdit = computed(() => !!articleId.value)
const categories = ref([])
const tags = ref([])
const loading = ref(false)
const saving = ref(false)

// 图片库选择封面
const pickerVisible = ref(false)
const pickerLoading = ref(false)
const pickerImages = ref([])

const openPicker = async () => {
  pickerVisible.value = true
  pickerLoading.value = true
  try {
    // 优先展示封面分类，没有则展示全部
    const res = await getImages({ page: 1, page_size: 60, category: '封面' })
    let list = res.list || []
    if (!list.length) {
      const all = await getImages({ page: 1, page_size: 60 })
      list = all.list || []
    }
    pickerImages.value = list
  } finally {
    pickerLoading.value = false
  }
}

const chooseCover = (img) => {
  form.value.cover = img.url
  pickerVisible.value = false
}

// 直接上传一张作为封面
const handleCoverUpload = async ({ file }) => {
  const res = await uploadImage(file, '封面')
  form.value.cover = res.url
  ElMessage.success('封面已上传')
}

// 正文插入图片
const contentInput = ref(null)
const insertVisible = ref(false)
const insertLoading = ref(false)
const insertImages = ref([])

const openInserter = async () => {
  insertVisible.value = true
  insertLoading.value = true
  try {
    // 优先展示插图分类，没有则展示全部
    const res = await getImages({ page: 1, page_size: 60, category: '插图' })
    let list = res.list || []
    if (!list.length) {
      const all = await getImages({ page: 1, page_size: 60 })
      list = all.list || []
    }
    insertImages.value = list
  } finally {
    insertLoading.value = false
  }
}

// 把 Markdown 图片语法插入到正文光标处
const insertImage = (url) => {
  const text = `![图片](${url})`
  const content = form.value.content || ''
  const el = contentInput.value?.textarea
  insertVisible.value = false

  if (!el) {
    form.value.content = content + (content && !content.endsWith('\n') ? '\n' : '') + text + '\n'
    return
  }
  const start = el.selectionStart ?? content.length
  const end = el.selectionEnd ?? start
  form.value.content = content.slice(0, start) + text + content.slice(end)
  nextTick(() => {
    el.focus()
    el.selectionStart = el.selectionEnd = start + text.length
  })
}

// 上传新图并直接插入正文
const handleInsertUpload = async ({ file }) => {
  const res = await uploadImage(file, '插图')
  insertImage(res.url)
  ElMessage.success('图片已上传并插入')
}

const form = ref({
  title: '',
  summary: '',
  content: '',
  cover: '',
  category_id: undefined,
  tag_ids: [],
  is_top: 0,
})

// 加载编辑数据
const loadEditData = async () => {
  loading.value = true
  try {
    const article = await getArticle(articleId.value)
    form.value = {
      title: article.title,
      summary: article.summary,
      content: article.content,
      cover: article.cover,
      category_id: article.category_id,
      tag_ids: (article.tags || []).map((t) => t.id),
      is_top: article.is_top,
    }
  } finally {
    loading.value = false
  }
}

// 保存文章
const handleSave = async (status) => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateArticle(articleId.value, { ...form.value, status })
    } else {
      await createArticle({ ...form.value, status })
    }
    ElMessage.success(status === 1 ? '文章已发布' : '已保存为草稿')
    router.push('/articles')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  categories.value = await getCategories()
  tags.value = await getTags()
  if (isEdit.value) loadEditData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cover-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.content-wrap {
  width: 100%;
}

.content-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.content-tip {
  font-size: 12px;
  color: #999;
}

.insert-actions {
  margin-bottom: 10px;
}

.cover-preview {
  width: 100%;
  margin-top: 8px;
}

.cover-preview img {
  max-width: 260px;
  max-height: 160px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  object-fit: cover;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  max-height: 460px;
  overflow-y: auto;
  min-height: 160px;
}

.picker-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.picker-item:hover {
  border-color: #409eff;
}

.picker-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

.picker-item img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  background: #f5f7fa;
}

.picker-name {
  display: block;
  padding: 6px 8px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
