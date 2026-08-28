import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'articles', name: 'articleList', component: () => import('@/views/ArticleList.vue'), meta: { title: '文章管理' } },
      { path: 'articles/create', name: 'articleCreate', component: () => import('@/views/ArticleEdit.vue'), meta: { title: '写文章' } },
      { path: 'articles/edit/:id', name: 'articleEdit', component: () => import('@/views/ArticleEdit.vue'), meta: { title: '编辑文章' } },
      { path: 'categories', name: 'categoryManage', component: () => import('@/views/CategoryManage.vue'), meta: { title: '分类管理' } },
      { path: 'tags', name: 'tagManage', component: () => import('@/views/TagManage.vue'), meta: { title: '标签管理' } },
      { path: 'comments', name: 'commentManage', component: () => import('@/views/CommentManage.vue'), meta: { title: '评论管理' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 全局前置守卫：登录鉴权
router.beforeEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 博客管理后台` : '博客管理后台'
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
