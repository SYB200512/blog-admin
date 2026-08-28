<template>
  <el-card shadow="never">
    <div class="toolbar">
      <el-input v-model="newName" placeholder="新分类名称" style="width: 200px" @keyup.enter="handleAdd" />
      <el-button type="primary" @click="handleAdd">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>
        添加分类
      </el-button>
    </div>

    <el-table :data="categories" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="名称" min-width="120">
        <template #default="{ row }">
          <el-input v-if="editingId === row.id" v-model="editForm.name" size="small" />
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="描述" min-width="200">
        <template #default="{ row }">
          <el-input v-if="editingId === row.id" v-model="editForm.description" size="small" />
          <span v-else>{{ row.description || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="article_count" label="文章数" width="90" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <template v-if="editingId === row.id">
            <el-button size="small" type="primary" link @click="handleSave">保存</el-button>
            <el-button size="small" link @click="cancelEdit">取消</el-button>
          </template>
          <template v-else>
            <el-button size="small" type="primary" link @click="startEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'

const categories = ref([])
const loading = ref(false)
const newName = ref('')
const editingId = ref(null)
const editForm = ref({ name: '', description: '' })

const loadData = async () => {
  loading.value = true
  try {
    categories.value = await getCategories()
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  if (!newName.value.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  await createCategory({ name: newName.value.trim() })
  ElMessage.success('添加成功')
  newName.value = ''
  loadData()
}

const startEdit = (row) => {
  editingId.value = row.id
  editForm.value = { name: row.name, description: row.description || '' }
}

const cancelEdit = () => {
  editingId.value = null
}

const handleSave = async () => {
  if (!editForm.value.name.trim()) {
    ElMessage.warning('分类名称不能为空')
    return
  }
  await updateCategory(editingId.value, editForm.value)
  ElMessage.success('保存成功')
  editingId.value = null
  loadData()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteCategory(row.id)
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
