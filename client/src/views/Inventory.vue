<template>
  <div class="inventory">
    <el-card class="stats-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">总库存</div>
            <div class="stat-value">{{ statsData.total?.total_units || 0 }} 袋</div>
            <div class="stat-sub">{{ statsData.total?.total_volume || 0 }} ml</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item stat-warning">
            <div class="stat-label">7天内临期</div>
            <div class="stat-value">{{ statsData.expire_7days?.count || 0 }} 袋</div>
            <div class="stat-sub">{{ statsData.expire_7days?.volume || 0 }} ml</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item stat-danger">
            <div class="stat-label">3天内临期</div>
            <div class="stat-value">{{ statsData.expire_3days?.count || 0 }} 袋</div>
            <div class="stat-sub">{{ statsData.expire_3days?.volume || 0 }} ml</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item stat-success">
            <div class="stat-label">血液类型</div>
            <div class="stat-value">{{ statsData.by_type?.length || 0 }} 类</div>
            <div class="stat-sub">
              <el-button type="primary" text size="small" @click="goToStockIn">去入库</el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="血液编号/库位" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="血型">
          <el-select v-model="searchForm.blood_type" placeholder="全部" clearable style="width: 100px">
            <el-option label="A型" value="A" />
            <el-option label="B型" value="B" />
            <el-option label="AB型" value="AB" />
            <el-option label="O型" value="O" />
          </el-select>
        </el-form-item>
        <el-form-item label="成分">
          <el-select v-model="searchForm.component_type" placeholder="全部" clearable style="width: 100px">
            <el-option label="全血" value="全血" />
            <el-option label="红细胞" value="红细胞" />
            <el-option label="血小板" value="血小板" />
            <el-option label="血浆" value="血浆" />
            <el-option label="冷沉淀" value="冷沉淀" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="在库" value="在库" />
            <el-option label="已预留" value="已预留" />
            <el-option label="已出库" value="已出库" />
            <el-option label="已报废" value="已报废" />
          </el-select>
        </el-form-item>
        <el-form-item label="临期">
          <el-select v-model="searchForm.expire_warning" placeholder="全部" clearable style="width: 120px">
            <el-option label="7天内" value="7" />
            <el-option label="3天内" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>库存列表</span>
          <div>
            <el-button type="success" @click="goToStockIn">
              <el-icon><Plus /></el-icon>
              血液入库
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="blood_no" label="血液编号" width="150" />
        <el-table-column prop="blood_type" label="血型" width="70" />
        <el-table-column prop="rh_factor" label="RH因子" width="80" />
        <el-table-column prop="component_type" label="成分类型" width="100" />
        <el-table-column prop="volume" label="血量(ml)" width="90" />
        <el-table-column prop="storage_location" label="存储位置" width="120" />
        <el-table-column prop="storage_date" label="入库日期" width="120" />
        <el-table-column prop="expire_date" label="过期日期" width="120" />
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag :type="getDaysLeftType(row.days_left)" size="small">
              {{ row.days_left > 0 ? row.days_left + '天' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" text size="small" @click="trackBlood(row)">追踪</el-button>
            <el-button 
              v-if="row.status === '在库'" 
              type="danger" 
              text 
              size="small" 
              @click="handleDiscard(row)"
            >
              报废
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        class="pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="detailVisible" title="库存详情" width="600px">
      <el-descriptions :column="2" border v-if="currentItem">
        <el-descriptions-item label="血液编号">{{ currentItem.blood_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentItem.status)">{{ currentItem.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="血型">{{ currentItem.blood_type }}型</el-descriptions-item>
        <el-descriptions-item label="RH因子">{{ currentItem.rh_factor }}</el-descriptions-item>
        <el-descriptions-item label="成分类型">{{ currentItem.component_type }}</el-descriptions-item>
        <el-descriptions-item label="血量">{{ currentItem.volume }}ml</el-descriptions-item>
        <el-descriptions-item label="存储位置">{{ currentItem.storage_location }}</el-descriptions-item>
        <el-descriptions-item label="存储温度">{{ currentItem.temperature }}℃</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ currentItem.storage_date }}</el-descriptions-item>
        <el-descriptions-item label="保质期">{{ currentItem.shelf_life_days }}天</el-descriptions-item>
        <el-descriptions-item label="过期日期">{{ currentItem.expire_date }}</el-descriptions-item>
        <el-descriptions-item label="剩余天数">
          <el-tag :type="getDaysLeftType(currentItem.days_left)">
            {{ currentItem.days_left > 0 ? currentItem.days_left + '天' : '已过期' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentItem.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="discardVisible" title="血液报废" width="500px">
      <el-form :model="discardForm" :rules="discardRules" ref="discardFormRef" label-width="100px">
        <el-form-item label="血液编号">
          <el-input v-model="discardForm.blood_no" disabled />
        </el-form-item>
        <el-form-item label="报废原因" prop="discard_reason">
          <el-select v-model="discardForm.discard_reason" style="width: 100%">
            <el-option label="检测不合格" value="检测不合格" />
            <el-option label="过期" value="过期" />
            <el-option label="破损" value="破损" />
            <el-option label="质量问题" value="质量问题" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="discardForm.operator" placeholder="请输入操作人姓名" />
        </el-form-item>
        <el-form-item label="审批人">
          <el-input v-model="discardForm.approver" placeholder="请输入审批人姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="discardForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="discardVisible = false">取消</el-button>
        <el-button type="danger" @click="submitDiscard" :loading="discarding">确认报废</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'

const router = useRouter()

const loading = ref(false)
const discarding = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const statsData = ref({})

const detailVisible = ref(false)
const discardVisible = ref(false)
const currentItem = ref(null)
const discardFormRef = ref(null)

const searchForm = ref({
  keyword: '',
  blood_type: '',
  component_type: '',
  status: '在库',
  expire_warning: ''
})

const discardForm = reactive({
  inventory_id: null,
  blood_no: '',
  discard_reason: '',
  discard_date: new Date().toISOString().split('T')[0],
  operator: '',
  approver: '',
  remark: ''
})

const discardRules = {
  discard_reason: [{ required: true, message: '请选择报废原因', trigger: 'change' }]
}

const getDaysLeftType = (days) => {
  if (days <= 0) return 'danger'
  if (days <= 3) return 'danger'
  if (days <= 7) return 'warning'
  return 'success'
}

const getStatusType = (status) => {
  const types = {
    '在库': 'success',
    '已预留': 'warning',
    '已出库': 'primary',
    '已报废': 'danger'
  }
  return types[status] || 'info'
}

const fetchStats = async () => {
  try {
    const data = await api.getInventoryStats()
    statsData.value = data
  } catch (e) {
    console.error(e)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await api.getInventory({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    })
    tableData.value = data.list
    total.value = data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.value = { keyword: '', blood_type: '', component_type: '', status: '在库', expire_warning: '' }
  currentPage.value = 1
  fetchList()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchList()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchList()
}

const goToStockIn = () => {
  router.push('/stock-in')
}

const viewDetail = async (row) => {
  try {
    const data = await api.getInventoryDetail(row.id)
    currentItem.value = data
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const trackBlood = (row) => {
  router.push({ path: '/tracking', query: { bloodNo: row.blood_no } })
}

const handleDiscard = (row) => {
  discardForm.inventory_id = row.id
  discardForm.blood_no = row.blood_no
  discardForm.discard_reason = ''
  discardForm.operator = ''
  discardForm.approver = ''
  discardForm.remark = ''
  discardVisible.value = true
}

const submitDiscard = () => {
  discardFormRef.value.validate(async (valid) => {
    if (valid) {
      ElMessageBox.confirm('确定要报废这袋血液吗？此操作不可撤销。', '确认报废', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        discarding.value = true
        try {
          await api.discardBlood(discardForm)
          ElMessage.success('报废成功')
          discardVisible.value = false
          fetchList()
          fetchStats()
        } catch (e) {
          console.error(e)
        } finally {
          discarding.value = false
        }
      }).catch(() => {})
    }
  })
}

onMounted(() => {
  fetchStats()
  fetchList()
})
</script>

<style scoped>
.inventory {
  padding: 0;
}

.stats-card {
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item.stat-warning {
  background: #fdf6ec;
}

.stat-item.stat-danger {
  background: #fef0f0;
}

.stat-item.stat-success {
  background: #f0f9eb;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-sub {
  font-size: 12px;
  color: #909399;
}

.search-card {
  margin-bottom: 15px;
}

.table-card {
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
