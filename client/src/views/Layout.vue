<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="32" color="#409EFF"><Droplet /></el-icon>
        <span class="logo-text">血库管理平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-sub-menu index="donor-manage">
          <template #title>
            <el-icon><User /></el-icon>
            <span>献血者管理</span>
          </template>
          <el-menu-item index="/donors">献血者列表</el-menu-item>
          <el-menu-item index="/collection">血液采集登记</el-menu-item>
          <el-menu-item index="/blood-list">血液记录</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="test-manage">
          <template #title>
            <el-icon><Reading /></el-icon>
            <span>实验室检测</span>
          </template>
          <el-menu-item index="/testing">检测录入</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="inventory-manage">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>库存管理</span>
          </template>
          <el-menu-item index="/inventory">库存查询</el-menu-item>
          <el-menu-item index="/stock-in">血液入库</el-menu-item>
          <el-menu-item index="/expiring">临期提醒</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="request-manage">
          <template #title>
            <el-icon><Tickets /></el-icon>
            <span>用血管理</span>
          </template>
          <el-menu-item index="/requests">用血申请</el-menu-item>
          <el-menu-item index="/request-new">新建申请</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/tracking">
          <el-icon><Position /></el-icon>
          <span>血液追踪</span>
        </el-menu-item>
        <el-menu-item index="/hospitals">
          <el-icon><OfficeBuilding /></el-icon>
          <span>医院管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="expireCount" class="header-badge" :hidden="expireCount === 0">
            <el-button type="primary" text @click="$router.push('/expiring')">
              <el-icon><Bell /></el-icon>
              <span>临期提醒</span>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ userInfo.real_name || userInfo.username || '管理员' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'
import { getUserInfo, removeToken, removeUserInfo } from '../utils/auth'

const route = useRoute()
const router = useRouter()
const expireCount = ref(0)
const userInfo = ref(getUserInfo() || {})

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => route.meta.title || '首页')

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await api.logout()
      } catch (e) {
        console.error(e)
      }
      removeToken()
      removeUserInfo()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  }
}

const fetchExpireCount = async () => {
  try {
    const data = await api.getExpiringSoon(7)
    expireCount.value = data.length || 0
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchExpireCount()
})
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.sidebar {
  background-color: #1f2d3d;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #18222e;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.sidebar-menu {
  border-right: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  color: #303133;
  font-size: 14px;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.header-badge {
  margin-right: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #263445;
}

:deep(.el-menu-item:hover) {
  background-color: #263445 !important;
}
</style>
