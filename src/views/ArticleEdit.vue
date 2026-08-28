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
        <el-input v-model="form.cover" placeholder="封面图 URL（可选）" />
      </el-form-item>
      <el-form-item label="置顶">
        <el-switch v-model="form.is_top" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="正文">
        <el-input v-model="form.content" type="textarea" :rows="18" placeholder="支持 Markdown 语法" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave(1)">
          发布
        </el-button>
        <el-button :loading="saving" @click="handleSave(0)">存为草稿</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getArticle, createArticle, updateArticle } from '@/api/article'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'

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
</style>
