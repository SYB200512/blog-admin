<template>
  <el-card shadow="never">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input v-model="query.keyword" placeholder="搜索文章..." clearable style="width: 240px"
        @keyup.enter="handleSearch" @clear="handleSearch" />
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px" @change="handleSearch">
        <el-option label="已发布" :value="1" />
        <el-option label="草稿" :value="0" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <div class="spacer" />
      <el-button type="primary" @click="$router.push('/articles/create')">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>
        写文章
      </el-button>
    </div>

    <!-- 文章表格 -->
    <el-table :data="articles" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column label="分类" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.category?.name || '未分类' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="140">
        <template #default="{ row }">
          <el-tag v-for="tag in row.tags" :key="tag.id" size="small" style="margin-right: 4px">
            {{ tag.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="views" label="阅读" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 1 ? 'success' : 'warning'">
            {{ row.status === 1 ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="110">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="$router.push(`/articles/edit/${row.id}`)">
            编辑
          </el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next" :total="total"
        :page-size="query.page_size" :current-page="query.page" @current-change="handlePageChange" />
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getArticles, deleteArticle } from '@/api/article'
import { formatDate } from '@/utils/format'

const articles = ref([])
const total = ref(0)
const loading = ref(false)
const query = ref({ page: 1, page_size: 10, keyword: '', status: undefined })

const loadData = async () => {
  loading.value = true
  try {
    const data = await getArticles(query.value)
    articles.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.value.page = 1
  loadData()
}

const handlePageChange = (p) => {
  query.value.page = p
  loadData()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除文章「${row.title}」吗？`, '提示', { type: 'warning' })
  await deleteArticle(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.spacer {
  flex: 1;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
