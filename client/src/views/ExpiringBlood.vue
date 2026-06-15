<template>
  <div class="expiring-blood">
    <el-card class="stats-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item stat-danger">
            <el-icon size="28" color="#F56C6C"><Warning /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ expire3Days.length }} 袋</div>
              <div class="stat-label">3天内过期</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item stat-warning">
            <el-icon size="28" color="#E6A23C"><Clock /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ expire7Days.length }} 袋</div>
              <div class="stat-label">7天内过期</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item stat-info">
            <el-icon size="28" color="#409EFF"><Bell /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ totalVolume }} ml</div>
              <div class="stat-label">临期血液总量</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-alert
      title="临期血液提醒"
      :description="alertMessage"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    />

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>临期血液列表</span>
          <el-radio-group v-model="daysFilter" @change="handleFilterChange">
            <el-radio-button label="7">7天内</el-radio-button>
            <el-radio-button label="14">14天内</el-radio-button>
            <el-radio-button label="30">30天内</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="expiringList" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="blood_no" label="血液编号" width="150" />
        <el-table-column prop="blood_type" label="血型" width="70">
          <template #default="{ row }">
            <span class="blood-type">{{ row.blood_type }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rh_factor" label="RH因子" width="80" />
        <el-table-column prop="component_type" label="成分类型" width="100" />
        <el-table-column prop="volume" label="血量(ml)" width="100" />
        <el-table-column prop="storage_location" label="存储位置" width="140" />
        <el-table-column prop="storage_date" label="入库日期" width="120" />
        <el-table-column prop="expire_date" label="过期日期" width="120" />
        <el-table-column label="剩余天数" width="120">
          <template #default="{ row }">
            <el-tag :type="getDaysLeftType(row.days_left)" size="small">
              <span v-if="row.days_left > 0">{{ row.days_left }} 天</span>
              <span v-else class="expired">已过期</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '在库' ? 'success' : 'warning'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="紧急程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getUrgencyType(row.days_left)" size="small">
              {{ getUrgencyLabel(row.days_left) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="trackBlood(row)">追踪</el-button>
            <el-button type="warning" text size="small">优先使用</el-button>
            <el-button type="danger" text size="small">报废</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="expiringList.length === 0 && !loading" description="暂无临期血液" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const loading = ref(false)
const expiringList = ref([])
const daysFilter = ref('7')
const expire3Days = ref([])
const expire7Days = ref([])

const totalVolume = computed(() => {
  return expiringList.value.reduce((sum, item) => sum + item.volume, 0)
})

const alertMessage = computed(() => {
  if (expire3Days.value.length > 0) {
    return `当前共有 ${expire7Days.value.length} 袋血液将在7天内过期，其中 ${expire3Days.value.length} 袋将在3天内过期，请及时处理！`
  }
  return `当前共有 ${expire7Days.value.length} 袋血液将在7天内过期，请合理安排使用。`
})

const getDaysLeftType = (days) => {
  if (days <= 0) return 'danger'
  if (days <= 3) return 'danger'
  if (days <= 7) return 'warning'
  return 'info'
}

const getUrgencyType = (days) => {
  if (days <= 0) return 'danger'
  if (days <= 3) return 'danger'
  if (days <= 7) return 'warning'
  return 'info'
}

const getUrgencyLabel = (days) => {
  if (days <= 0) return '已过期'
  if (days <= 3) return '紧急'
  if (days <= 7) return '警告'
  return '正常'
}

const fetchExpiring = async (days = 7) => {
  loading.value = true
  try {
    const data = await api.getExpiringSoon(days)
    expiringList.value = data
    expire7Days.value = data
    
    expire3Days.value = data.filter(item => item.days_left <= 3)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = (val) => {
  fetchExpiring(parseInt(val))
}

const trackBlood = (row) => {
  router.push({ path: '/tracking', query: { bloodNo: row.blood_no } })
}

onMounted(() => {
  fetchExpiring(7)
})
</script>

<style scoped>
.expiring-blood {
  padding: 0;
}

.stats-card {
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #ebeef5;
}

.stat-item.stat-danger {
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
}

.stat-item.stat-warning {
  background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
}

.stat-item.stat-info {
  background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.blood-type {
  font-weight: bold;
  color: #409EFF;
}

.expired {
  color: #F56C6C;
  font-weight: bold;
}
</style>
