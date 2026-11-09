<template>
  <div class="editor-page" v-loading="loading">
    <!-- 顶栏：状态 + 标题 + 操作 -->
    <div class="editor-top">
      <el-select v-model="form.status" class="status-select" :teleported="false">
        <el-option label="发布" :value="1" />
        <el-option label="草稿" :value="0" />
      </el-select>
      <el-input v-model="form.title" class="title-input" placeholder="请输入文章标题" maxlength="200" />
      <div class="top-actions">
        <el-button @click="$router.back()">返回</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <button class="tb-btn tb-bold" title="加粗" @click="wrapSelection('**', '**', '加粗文本')">B</button>
      <button class="tb-btn tb-italic" title="斜体" @click="wrapSelection('*', '*', '斜体文本')">I</button>
      <button class="tb-btn tb-strike" title="删除线" @click="wrapSelection('~~', '~~', '删除文本')">S</button>
      <button class="tb-btn" title="行内代码" @click="wrapSelection('`', '`', 'code')">&lt;/&gt;</button>
      <span class="tb-divider"></span>
      <button class="tb-btn" title="一级标题" @click="prefixLine('# ')">H1</button>
      <button class="tb-btn" title="二级标题" @click="prefixLine('## ')">H2</button>
      <button class="tb-btn" title="三级标题" @click="prefixLine('### ')">H3</button>
      <button class="tb-btn" title="四级标题" @click="prefixLine('#### ')">H4</button>
      <span class="tb-divider"></span>
      <button class="tb-btn" title="引用" @click="prefixLine('> ')">引用</button>
      <button class="tb-btn" title="无序列表" @click="prefixLine('- ')">• 列表</button>
      <button class="tb-btn" title="有序列表" @click="prefixLine('1. ')">1. 列表</button>
      <span class="tb-divider"></span>
      <button class="tb-btn" title="插入链接" @click="wrapSelection('[', '](http://)', '链接文字')">链接</button>
      <button class="tb-btn" title="从图片库插入图片" @click="openInserter">图片</button>
      <button class="tb-btn" title="插入表格" @click="insertText(TABLE_TEMPLATE)">表格</button>
      <button class="tb-btn" title="插入代码块" @click="insertText(CODE_TEMPLATE)">代码块</button>
      <button class="tb-btn" title="插入分割线" @click="insertText('\n---\n')">分隔线</button>
      <span class="tb-divider"></span>
      <button class="tb-btn" title="在光标处插入正文图片（上传）" @click="openInserter">插图库</button>
      <span class="tb-tip">支持 Markdown，右侧实时预览</span>
    </div>

    <!-- 编辑区：左源码 右预览 -->
    <div class="editor-body">
      <div class="source-pane">
        <div ref="gutterRef" class="gutter">
          <div v-for="n in lineCount" :key="n" class="gutter-line">{{ n }}</div>
        </div>
        <textarea ref="editorRef" v-model="form.content" class="source-input" spellcheck="false"
          placeholder="Enjoy Markdown! coding now...." @scroll="syncScroll" @keydown.tab.prevent="insertTab"></textarea>
      </div>
      <div class="preview-pane">
        <div v-if="!form.content.trim()" class="preview-empty">预览区</div>
        <div v-else class="markdown-body" v-html="previewHtml"></div>
      </div>
    </div>

    <!-- 底部元信息：分类 / 标签 / 置顶 / 摘要 / 首图 -->
    <div class="editor-meta">
      <div class="meta-row">
        <span class="meta-label">分类</span>
        <el-select v-model="form.category_id" placeholder="分类" clearable style="width: 180px">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
        <span class="meta-label">标签</span>
        <el-select v-model="form.tag_ids" multiple collapse-tags placeholder="选择标签" class="tag-select">
          <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
        </el-select>
        <span class="meta-label">置顶</span>
        <el-switch v-model="form.is_top" :active-value="1" :inactive-value="0" />
      </div>
      <div class="meta-row">
        <span class="meta-label">摘要</span>
        <el-input v-model="form.summary" placeholder="文章摘要（可选，用于 SEO 描述）" maxlength="500" class="meta-input" />
      </div>
      <div class="meta-row">
        <span class="meta-label">首图</span>
        <el-input v-model="form.cover" placeholder="首图引用地址（可选）" class="meta-input" />
        <el-button @click="openPicker">从图片库选择</el-button>
        <el-upload :show-file-list="false" :http-request="handleCoverUpload" accept="image/*">
          <el-button>上传</el-button>
        </el-upload>
        <img v-if="form.cover" :src="form.cover" class="cover-thumb" alt="首图预览" />
      </div>
    </div>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
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

const form = ref({
  title: '',
  summary: '',
  content: '',
  cover: '',
  category_id: undefined,
  tag_ids: [],
  is_top: 0,
  status: 1,
})

// ---------- Markdown 预览 ----------
const md = new MarkdownIt({ html: true, linkify: true, breaks: true })
const previewHtml = computed(() => md.render(form.value.content || ''))

// ---------- 编辑器：行号与光标操作 ----------
const editorRef = ref(null)
const gutterRef = ref(null)
const lineCount = computed(() => (form.value.content || '').split('\n').length)

// 行号与编辑区同步滚动
const syncScroll = () => {
  if (gutterRef.value && editorRef.value) {
    gutterRef.value.scrollTop = editorRef.value.scrollTop
  }
}

// 在光标处插入文本，并把光标移到插入内容之后
const insertText = (text, selectFrom = 0, selectTo = 0) => {
  const el = editorRef.value
  const content = form.value.content || ''
  if (!el) return
  const start = el.selectionStart ?? content.length
  const end = el.selectionEnd ?? start
  form.value.content = content.slice(0, start) + text + content.slice(end)
  nextTick(() => {
    el.focus()
    el.selectionStart = start + (selectFrom || text.length)
    el.selectionEnd = start + (selectTo || selectFrom || text.length)
  })
}

// 用前缀/后缀包裹选中文本
const wrapSelection = (before, after = before, placeholder = '') => {
  const el = editorRef.value
  const content = form.value.content || ''
  if (!el) return
  const start = el.selectionStart ?? content.length
  const end = el.selectionEnd ?? start
  const selected = content.slice(start, end) || placeholder
  const text = before + selected + after
  form.value.content = content.slice(0, start) + text + content.slice(end)
  nextTick(() => {
    el.focus()
    el.selectionStart = start + before.length
    el.selectionEnd = start + before.length + selected.length
  })
}

// 给当前行加前缀（标题 / 列表 / 引用）
const prefixLine = (prefix) => {
  const el = editorRef.value
  const content = form.value.content || ''
  if (!el) return
  const pos = el.selectionStart ?? content.length
  const lineStart = content.lastIndexOf('\n', pos - 1) + 1
  form.value.content = content.slice(0, lineStart) + prefix + content.slice(lineStart)
  nextTick(() => {
    el.focus()
    el.selectionStart = el.selectionEnd = pos + prefix.length
  })
}

// Tab 插入两个空格而不是切换焦点
const insertTab = () => insertText('  ')

const TABLE_TEMPLATE = '\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n'
const CODE_TEMPLATE = '\n```\n代码\n```\n'

// ---------- 图片库选择封面 ----------
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

// ---------- 正文插入图片 ----------
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
  insertVisible.value = false
  insertText(`![图片](${url})`)
}

// 上传新图并直接插入正文
const handleInsertUpload = async ({ file }) => {
  const res = await uploadImage(file, '插图')
  insertImage(res.url)
  ElMessage.success('图片已上传并插入')
}

// ---------- 数据加载与保存 ----------
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
      status: article.status,
    }
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateArticle(articleId.value, { ...form.value })
    } else {
      await createArticle({ ...form.value })
    }
    ElMessage.success(form.value.status === 1 ? '文章已发布' : '已保存为草稿')
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
/* 整页按编辑器布局撑满内容区（顶栏 60px + el-main 上下内边距 40px） */
.editor-page {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

/* 顶栏 */
.editor-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #e8ebf0;
}

/* 左上角状态芯片，样式接近「原创」标签 */
.status-select {
  width: 96px;
  flex: none;
}

.status-select :deep(.el-select__wrapper) {
  background: #1b7fc4;
  box-shadow: none;
  border-radius: 3px;
  min-height: 30px;
  padding: 0 8px;
}

.status-select :deep(.el-select__selected-item),
.status-select :deep(.el-select__caret) {
  color: #fff;
}

.status-select :deep(.el-select__selected-item) {
  font-weight: 600;
}

/* 标题输入：无边框大字号，像文档标题 */
.title-input {
  flex: 1;
  min-width: 0;
}

.title-input :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0 4px;
  background: transparent;
}

.title-input :deep(.el-input__inner) {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  height: 32px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 5px 10px;
  border-bottom: 1px solid #e8ebf0;
  background: #fff;
}

.tb-btn {
  min-width: 28px;
  height: 26px;
  padding: 0 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #374151;
  font-size: 13px;
  line-height: 26px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.tb-btn:hover {
  background: #eef4fb;
  color: #1b7fc4;
}

.tb-bold {
  font-weight: 700;
}

.tb-italic {
  font-style: italic;
  font-family: Georgia, serif;
}

.tb-strike {
  text-decoration: line-through;
}

.tb-divider {
  width: 1px;
  height: 16px;
  background: #e5e7eb;
  margin: 0 6px;
}

.tb-tip {
  margin-left: auto;
  font-size: 12px;
  color: #9ca3af;
}

/* 编辑区 */
.editor-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.source-pane {
  flex: 1;
  display: flex;
  min-width: 0;
  position: relative;
}

.gutter {
  width: 42px;
  flex: none;
  overflow: hidden;
  padding: 12px 0;
  background: #fafbfc;
  border-right: 1px solid #f0f2f5;
  font-family: ui-monospace, Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 24px;
  color: #b6bdc8;
  text-align: right;
  user-select: none;
}

.gutter-line {
  padding-right: 8px;
}

.source-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  resize: none;
  padding: 12px 14px;
  background: transparent;
  color: #2c3e50;
  font-family: ui-monospace, Consolas, 'Courier New', monospace;
  font-size: 14px;
  line-height: 24px;
}

.source-input::placeholder {
  color: #9aa4b2;
}

.preview-pane {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 14px 22px;
  border-left: 1px solid #e5e7eb;
  background: #fff;
}

.preview-empty {
  color: #c0c6cf;
  font-size: 14px;
}

/* 预览 markdown 样式 */
.markdown-body {
  font-size: 15px;
  line-height: 1.75;
  color: #2c3e50;
  word-wrap: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 18px 0 10px;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-body :deep(h1) { font-size: 26px; }
.markdown-body :deep(h2) { font-size: 22px; }
.markdown-body :deep(h3) { font-size: 19px; }
.markdown-body :deep(h4) { font-size: 17px; }

.markdown-body :deep(p) {
  margin: 10px 0;
}

.markdown-body :deep(a) {
  color: #1b7fc4;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  display: block;
  margin: 10px 0;
}

.markdown-body :deep(blockquote) {
  margin: 12px 0;
  padding: 6px 14px;
  border-left: 3px solid #d0d7e2;
  background: #f8fafc;
  color: #5b6675;
}

.markdown-body :deep(pre) {
  margin: 12px 0;
  padding: 12px 14px;
  background: #f6f8fa;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

.markdown-body :deep(code) {
  font-family: ui-monospace, Consolas, 'Courier New', monospace;
  font-size: 13px;
  background: #f2f4f7;
  padding: 1px 5px;
  border-radius: 3px;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f8fafc;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 22px;
  margin: 10px 0;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 16px 0;
}

/* 底部元信息 */
.editor-meta {
  border-top: 1px solid #e8ebf0;
  padding: 8px 12px 10px;
  background: #fff;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-row + .meta-row {
  margin-top: 8px;
}

.meta-label {
  flex: none;
  font-size: 13px;
  color: #6b7280;
}

.meta-input {
  flex: 1;
  min-width: 0;
}

.tag-select {
  flex: 1;
  min-width: 180px;
  max-width: 460px;
}

.cover-thumb {
  width: 56px;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  flex: none;
}

/* 图片选择弹窗 */
.insert-actions {
  margin-bottom: 10px;
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

/* 小屏只保留源码区，避免两边都挤 */
@media (max-width: 900px) {
  .preview-pane {
    display: none;
  }

  .tag-select {
    max-width: none;
  }
}
</style>
