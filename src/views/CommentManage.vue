<template>
  <el-card shadow="never">
    <div class="toolbar">
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 150px" @change="handleSearch">
        <el-option label="待审核" :value="0" />
        <el-option label="已通过" :value="1" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>

    <el-table :data="comments" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="article_id" label="文章ID" width="90" />
      <el-table-column label="评论者" width="120">
        <template #default="{ row }">
          {{ row.nickname || row.user?.nickname || row.user?.username || '匿名' }}
        </template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="220" show-overflow-tooltip />
      <el-table-column label="时间" width="110">
        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 1 ? 'success' : 'warning'">
            {{ row.status === 1 ? '已通过' : '待审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button size="small" type="success" link @click="handleReview(row, 1)">通过</el-button>
          </template>
          <el-button size="small" type="danger" link @click="handleReview(row, 2)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next" :total="total"
        :page-size="query.page_size" :current-page="query.page" @current-change="handlePageChange" />
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getComments, reviewComment } from '@/api/comment'
import { formatDateTime } from '@/utils/format'

const comments = ref([])
const total = ref(0)
const loading = ref(false)
const query = ref({ page: 1, page_size: 10, status: undefined })

const loadData = async () => {
  loading.value = true
  try {
    const data = await getComments(query.value)
    comments.value = data.list
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

const handleReview = async (row, status) => {
  if (status === 2) {
    await ElMessageBox.confirm('确定删除该评论吗？', '提示', { type: 'warning' })
  }
  await reviewComment(row.id, status)
  ElMessage.success(status === 1 ? '已通过' : '已删除')
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
