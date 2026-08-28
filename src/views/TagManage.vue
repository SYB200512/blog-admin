<template>
  <el-card shadow="never">
    <div class="toolbar">
      <el-input v-model="newName" placeholder="新标签名称" style="width: 200px" @keyup.enter="handleAdd" />
      <el-button type="primary" @click="handleAdd">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>
        添加标签
      </el-button>
    </div>

    <el-table :data="tags" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="标签名" min-width="150" />
      <el-table-column prop="article_count" label="文章数" width="100" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTags, createTag, deleteTag } from '@/api/tag'

const tags = ref([])
const loading = ref(false)
const newName = ref('')

const loadData = async () => {
  loading.value = true
  try {
    tags.value = await getTags()
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  if (!newName.value.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  await createTag({ name: newName.value.trim() })
  ElMessage.success('添加成功')
  newName.value = ''
  loadData()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除标签「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteTag(row.id)
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
</style>
