<template>
  <div>
    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-item">
          <el-icon :size="28" color="#409eff"><Document /></el-icon>
          <div>
            <div class="stat-value">{{ stats.articles }}</div>
            <div class="stat-label">文章总数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-item">
          <el-icon :size="28" color="#67c23a"><ChatDotRound /></el-icon>
          <div>
            <div class="stat-value">{{ stats.comments }}</div>
            <div class="stat-label">评论总数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-item">
          <el-icon :size="28" color="#e6a23c"><Folder /></el-icon>
          <div>
            <div class="stat-value">{{ stats.categories }}</div>
            <div class="stat-label">分类数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-item">
          <el-icon :size="28" color="#f56c6c"><PriceTag /></el-icon>
          <div>
            <div class="stat-value">{{ stats.tags }}</div>
            <div class="stat-label">标签数</div>
          </div>
        </div>
      </el-card>
    </div>

    <el-card shadow="never" class="welcome-card">
      <h3>欢迎回来，{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</h3>
      <p>在这里可以管理你的文章、分类、标签和评论。</p>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/articles/create')">
          <el-icon style="margin-right: 4px"><EditPen /></el-icon>
          写文章
        </el-button>
        <el-button @click="$router.push('/articles')">文章管理</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getArticles } from '@/api/article'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'
import { getComments } from '@/api/comment'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const stats = ref({ articles: 0, comments: 0, categories: 0, tags: 0 })

onMounted(async () => {
  const [articles, comments, categories, tags] = await Promise.all([
    getArticles({ page: 1, page_size: 1 }),
    getComments({ page: 1, page_size: 1 }),
    getCategories(),
    getTags(),
  ])
  stats.value = {
    articles: articles.total,
    comments: comments.total,
    categories: categories.length,
    tags: tags.length,
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  color: #999;
  font-size: 13px;
}

.welcome-card {
  margin-top: 20px;
}

.welcome-card h3 {
  margin-bottom: 8px;
}

.welcome-card p {
  color: #666;
  margin-bottom: 16px;
}
</style>
