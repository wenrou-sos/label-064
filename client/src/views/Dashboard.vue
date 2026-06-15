<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card stat-blue">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="36"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_donors || 0 }}</div>
              <div class="stat-label">献血者总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-green">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="36"><Droplet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.today_collection?.volume || 0 }} ml</div>
              <div class="stat-label">今日采集量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-orange">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="36"><Box /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.inventory?.total_volume || 0 }} ml</div>
              <div class="stat-label">库存总量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-red">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="36"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.expire_7days?.count || 0 }} 袋</div>
              <div class="stat-label">7天内临期</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>血型库存分布</span>
            </div>
          </template>
          <div ref="bloodTypeChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近6个月采集趋势</span>
            </div>
          </template>
          <div ref="trendChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待处理申请</span>
              <el-button type="primary" text size="small" @click="$router.push('/requests')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="stats.recent_requests || []" size="small">
            <el-table-column prop="request_no" label="申请单号" width="130" />
            <el-table-column prop="hospital_name" label="医院" show-overflow-tooltip />
            <el-table-column prop="patient_name" label="患者" width="80" />
            <el-table-column prop="patient_blood_type" label="血型" width="60" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近采集记录</span>
              <el-button type="primary" text size="small" @click="$router.push('/blood-list')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="stats.recent_donations || []" size="small">
            <el-table-column prop="blood_no" label="血液编号" width="140" />
            <el-table-column prop="donor_name" label="献血者" width="80" />
            <el-table-column prop="blood_type" label="血型" width="60" />
            <el-table-column prop="volume" label="血量(ml)" width="80" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getBloodStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待检测</span>
            </div>
          </template>
          <div class="quick-stat">
            <div class="quick-stat-value">{{ stats.pending_tests || 0 }}</div>
            <div class="quick-stat-label">份样本待检测</div>
            <el-button type="primary" size="small" @click="$router.push('/testing')">去检测</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待审核申请</span>
            </div>
          </template>
          <div class="quick-stat">
            <div class="quick-stat-value">{{ stats.pending_requests || 0 }}</div>
            <div class="quick-stat-label">条申请待处理</div>
            <el-button type="primary" size="small" @click="$router.push('/requests')">去处理</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>今日发血</span>
            </div>
          </template>
          <div class="quick-stat">
            <div class="quick-stat-value">{{ stats.today_issues?.volume || 0 }} ml</div>
            <div class="quick-stat-label">今日已发血量</div>
            <el-button type="primary" size="small" @click="$router.push('/requests')">查看详情</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { api } from '../api'
import * as echarts from 'echarts'

const stats = ref({})
const bloodTypeChart = ref(null)
const trendChart = ref(null)

const getStatusType = (status) => {
  const types = {
    '待审核': 'warning',
    '已审核': 'info',
    '配血中': 'primary',
    '已发血': 'success',
    '已完成': 'success',
    '已取消': 'danger',
    '部分发血': 'warning'
  }
  return types[status] || 'info'
}

const getBloodStatusType = (status) => {
  const types = {
    '待检测': 'info',
    '检测中': 'warning',
    '合格': 'success',
    '不合格': 'danger',
    '已入库': 'success',
    '已出库': 'primary',
    '已使用': 'success',
    '已报废': 'danger'
  }
  return types[status] || 'info'
}

const initBloodTypeChart = () => {
  if (!bloodTypeChart.value) return
  const chart = echarts.init(bloodTypeChart.value)
  const data = stats.blood_type_stats || []
  const types = ['A', 'B', 'AB', 'O']
  const volumes = types.map(t => {
    const item = data.find(d => d.blood_type === t)
    return item ? item.volume : 0
  })
  
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 10 },
    series: [{
      name: '血液库存量',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}ml' },
      data: types.map((t, i) => ({ name: t + '型', value: volumes[i] })),
      color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
    }]
  })
}

const initTrendChart = () => {
  if (!trendChart.value) return
  const chart = echarts.init(trendChart.value)
  const data = stats.monthly_trend || []
  const months = data.map(d => d.month)
  const volumes = data.map(d => d.volume)
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: months, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', name: 'ml', axisLabel: { fontSize: 11 } },
    series: [{
      name: '采集量',
      type: 'line',
      smooth: true,
      data: volumes,
      areaStyle: { opacity: 0.2 },
      lineStyle: { width: 3, color: '#409EFF' },
      itemStyle: { color: '#409EFF' }
    }],
    grid: { left: 50, right: 20, top: 20, bottom: 40 }
  })
}

const fetchStats = async () => {
  try {
    const data = await api.getDashboardStats()
    stats.value = data
    await nextTick()
    initBloodTypeChart()
    initTrendChart()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  border-radius: 8px;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-blue .stat-icon {
  background: linear-gradient(135deg, #409EFF 0%, #1890ff 100%);
}

.stat-green .stat-icon {
  background: linear-gradient(135deg, #67C23A 0%, #52c41a 100%);
}

.stat-orange .stat-icon {
  background: linear-gradient(135deg, #E6A23C 0%, #fa8c16 100%);
}

.stat-red .stat-icon {
  background: linear-gradient(135deg, #F56C6C 0%, #f5222d 100%);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.content-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.quick-stat {
  text-align: center;
  padding: 10px 0;
}

.quick-stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.quick-stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 15px;
}
</style>
