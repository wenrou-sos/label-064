import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../views/Layout.vue'
import { isLoggedIn } from '../utils/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataLine', requiresAuth: true }
      },
      {
        path: 'donors',
        name: 'Donors',
        component: () => import('../views/DonorList.vue'),
        meta: { title: '献血者管理', icon: 'User', requiresAuth: true }
      },
      {
        path: 'collection',
        name: 'Collection',
        component: () => import('../views/BloodCollection.vue'),
        meta: { title: '血液采集', icon: 'Plus', requiresAuth: true }
      },
      {
        path: 'blood-list',
        name: 'BloodList',
        component: () => import('../views/BloodList.vue'),
        meta: { title: '血液记录', icon: 'Document', requiresAuth: true }
      },
      {
        path: 'testing',
        name: 'Testing',
        component: () => import('../views/BloodTesting.vue'),
        meta: { title: '实验室检测', icon: 'Reading', requiresAuth: true }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../views/Inventory.vue'),
        meta: { title: '库存管理', icon: 'Box', requiresAuth: true }
      },
      {
        path: 'stock-in',
        name: 'StockIn',
        component: () => import('../views/StockIn.vue'),
        meta: { title: '血液入库', icon: 'Download', requiresAuth: true }
      },
      {
        path: 'requests',
        name: 'Requests',
        component: () => import('../views/BloodRequests.vue'),
        meta: { title: '用血申请', icon: 'Tickets', requiresAuth: true }
      },
      {
        path: 'request-new',
        name: 'RequestNew',
        component: () => import('../views/RequestNew.vue'),
        meta: { title: '新建申请', icon: 'Edit', requiresAuth: true }
      },
      {
        path: 'tracking',
        name: 'Tracking',
        component: () => import('../views/BloodTracking.vue'),
        meta: { title: '血液追踪', icon: 'Position', requiresAuth: true }
      },
      {
        path: 'hospitals',
        name: 'Hospitals',
        component: () => import('../views/HospitalList.vue'),
        meta: { title: '医院管理', icon: 'OfficeBuilding', requiresAuth: true }
      },
      {
        path: 'expiring',
        name: 'Expiring',
        component: () => import('../views/ExpiringBlood.vue'),
        meta: { title: '临期提醒', icon: 'AlarmClock', requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 血库全流程管理平台` : '血库全流程管理平台'
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth) {
    if (!isLoggedIn()) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    if (to.path === '/login' && isLoggedIn()) {
      next('/dashboard')
    } else {
      next()
    }
  }
})

export default router
