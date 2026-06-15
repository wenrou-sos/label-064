<template>
  <div class="blood-tracking">
    <el-card class="search-card">
      <el-form :inline="true">
        <el-form-item label="血液编号">
          <el-input
            v-model="bloodNo"
            placeholder="请输入血液编号"
            style="width: 300px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="trackBlood" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="trackingData" class="tracking-card">
      <el-descriptions :column="3" border style="margin-bottom: 20px">
        <el-descriptions-item label="血液编号">{{ trackingData.blood_unit.blood_no }}</el-descriptions-item>
        <el-descriptions-item label="献血者">{{ trackingData.blood_unit.donor_name }}</el-descriptions-item>
        <el-descriptions-item label="献血者编号">{{ trackingData.blood_unit.donor_no }}</el-descriptions-item>
        <el-descriptions-item label="血型">{{ trackingData.blood_unit.blood_type }}型</el-descriptions-item>
        <el-descriptions-item label="RH因子">{{ trackingData.blood_unit.rh_factor }}</el-descriptions-item>
        <el-descriptions-item label="成分类型">{{ trackingData.blood_unit.component_type }}</el-descriptions-item>
        <el-descriptions-item label="血量">{{ trackingData.blood_unit.volume }}ml</el-descriptions-item>
        <el-descriptions-item label="采集地点">{{ trackingData.blood_unit.collection_site }}</el-descriptions-item>
        <el-descriptions-item label="采集日期">{{ trackingData.blood_unit.collection_date }}</el-descriptions-item>
        <el-descriptions-item label="当前状态" :span="3">
          <el-tag size="large" :type="getStatusType(trackingData.blood_unit.status)">
            {{ trackingData.blood_unit.status }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">流转记录</el-divider>

      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in trackingData.tracking_history"
          :key="item.id"
          :timestamp="item.operate_time"
          :type="getTimelineType(item.status)"
          placement="top"
        >
          <el-card>
            <h4 style="margin-bottom: 10px">
              <el-tag :type="getTagType(item.status)">{{ item.status }}</el-tag>
            </h4>
            <p><b>位置：</b>{{ item.location }}</p>
            <p><b>操作人：</b>{{ item.operator }}</p>
            <p v-if="item.remark"><b>备注：</b>{{ item.remark }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-row :gutter="20" style="margin-top: 30px" v-if="trackingData.test_info || trackingData.inventory_info || trackingData.issue_info">
        <el-col :span="8" v-if="trackingData.test_info">
          <el-card>
            <template #header>
              <span>检测信息</span>
            </template>
            <div class="info-item">
              <span class="label">转氨酶:</span>
              <span class="value">{{ trackingData.test_info.alt_level }} U/L</span>
            </div>
            <div class="info-item">
              <span class="label">乙肝表面抗原:</span>
              <el-tag size="small" :type="trackingData.test_info.hbsag === '阴性' ? 'success' : 'danger'">
                {{ trackingData.test_info.hbsag }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">总体结果:</span>
              <el-tag size="small" :type="trackingData.test_info.overall_result === '合格' ? 'success' : 'danger'">
                {{ trackingData.test_info.overall_result }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8" v-if="trackingData.inventory_info">
          <el-card>
            <template #header>
              <span>库存信息</span>
            </template>
            <div class="info-item">
              <span class="label">存储位置:</span>
              <span class="value">{{ trackingData.inventory_info.storage_location }}</span>
            </div>
            <div class="info-item">
              <span class="label">入库日期:</span>
              <span class="value">{{ trackingData.inventory_info.storage_date }}</span>
            </div>
            <div class="info-item">
              <span class="label">过期日期:</span>
              <span class="value">{{ trackingData.inventory_info.expire_date }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8" v-if="trackingData.issue_info">
          <el-card>
            <template #header>
              <span>发血信息</span>
            </template>
            <div class="info-item">
              <span class="label">发往医院:</span>
              <span class="value">{{ trackingData.issue_info.hospital_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">患者:</span>
              <span class="value">{{ trackingData.issue_info.patient_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">发血时间:</span>
              <span class="value">{{ trackingData.issue_info.issue_date }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-empty v-else-if="!loading && !trackingData" description="请输入血液编号进行查询" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const route = useRoute()
const loading = ref(false)
const bloodNo = ref('')
const trackingData = ref(null)

const getStatusType = (status) => {
  const types = {
    '待检测': 'info',
    '检测中': 'warning',
    '合格': 'success',
    '不合格': 'danger',
    '已入库': 'success',
    '已出库': 'primary',
    '已发往医院': 'primary',
    '已接收': 'warning',
    '已使用': 'success',
    '已输血': 'success',
    '已报废': 'danger'
  }
  return types[status] || 'info'
}

const getTimelineType = (status) => {
  const types = {
    '已采集': 'primary',
    '检测中': 'warning',
    '检测合格': 'success',
    '检测不合格': 'danger',
    '已入库': 'success',
    '已预留': 'warning',
    '已出库': 'primary',
    '已发往医院': 'primary',
    '已接收': 'warning',
    '已输血': 'success',
    '已报废': 'danger'
  }
  return types[status] || 'info'
}

const getTagType = (status) => {
  return getStatusType(status)
}

const trackBlood = async () => {
  if (!bloodNo.value.trim()) {
    ElMessage.warning('请输入血液编号')
    return
  }
  loading.value = true
  trackingData.value = null
  try {
    const data = await api.trackBlood(bloodNo.value)
    trackingData.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.bloodNo) {
    bloodNo.value = route.query.bloodNo
    trackBlood()
  }
})
</script>

<style scoped>
.blood-tracking {
  padding: 0;
}

.search-card {
  margin-bottom: 20px;
}

.tracking-card {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #909399;
  font-size: 13px;
}

.value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}

:deep(.el-card) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
