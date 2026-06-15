<template>
  <div class="blood-requests">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="申请单号/医院/患者" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审核" value="待审核" />
            <el-option label="已审核" value="已审核" />
            <el-option label="配血中" value="配血中" />
            <el-option label="已发血" value="已发血" />
            <el-option label="部分发血" value="部分发血" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="血型">
          <el-select v-model="searchForm.blood_type" placeholder="全部" clearable style="width: 100px">
            <el-option label="A型" value="A" />
            <el-option label="B型" value="B" />
            <el-option label="AB型" value="AB" />
            <el-option label="O型" value="O" />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-select v-model="searchForm.urgency" placeholder="全部" clearable style="width: 100px">
            <el-option label="常规" value="常规" />
            <el-option label="加急" value="加急" />
            <el-option label="紧急" value="紧急" />
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
          <span>用血申请列表</span>
          <el-button type="primary" @click="$router.push('/request-new')">
            <el-icon><Plus /></el-icon>
            新建申请
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="request_no" label="申请单号" width="140" />
        <el-table-column prop="urgency" label="紧急程度" width="90">
          <template #default="{ row }">
            <el-tag :type="getUrgencyType(row.urgency)" size="small">{{ row.urgency }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hospital_name" label="医院" show-overflow-tooltip />
        <el-table-column prop="patient_name" label="患者" width="100" />
        <el-table-column prop="patient_blood_type" label="血型" width="70" />
        <el-table-column prop="component_type" label="成分" width="100" />
        <el-table-column prop="request_volume" label="申请量(ml)" width="110" />
        <el-table-column prop="issued_volume" label="已发(ml)" width="100" />
        <el-table-column prop="request_date" label="申请日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === '待审核'" type="success" text size="small" @click="handleAudit(row)">审核</el-button>
            <el-button v-if="['已审核','配血中','部分发血'].includes(row.status)" type="primary" text size="small" @click="handleIssue(row)">发血</el-button>
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

    <el-dialog v-model="detailVisible" title="申请详情" width="700px">
      <el-descriptions :column="3" border v-if="currentRequest">
        <el-descriptions-item label="申请单号" :span="2">{{ currentRequest.request_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRequest.status)">{{ currentRequest.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="医院" :span="2">{{ currentRequest.hospital_name }}</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getUrgencyType(currentRequest.urgency)">{{ currentRequest.urgency }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="患者姓名">{{ currentRequest.patient_name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentRequest.patient_gender || '-' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ currentRequest.patient_age ? currentRequest.patient_age + '岁' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="血型">{{ currentRequest.patient_blood_type }}型</el-descriptions-item>
        <el-descriptions-item label="RH因子">{{ currentRequest.rh_factor }}</el-descriptions-item>
        <el-descriptions-item label="血液成分">{{ currentRequest.component_type }}</el-descriptions-item>
        <el-descriptions-item label="申请血量">{{ currentRequest.request_volume }}ml ({{ currentRequest.request_units }}袋)</el-descriptions-item>
        <el-descriptions-item label="已发血量">{{ currentRequest.issued_volume }}ml ({{ currentRequest.issued_units }}袋)</el-descriptions-item>
        <el-descriptions-item label="申请医生">{{ currentRequest.requester || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请日期">{{ currentRequest.request_date }}</el-descriptions-item>
        <el-descriptions-item label="临床诊断" :span="3">{{ currentRequest.clinical_diagnosis || '-' }}</el-descriptions-item>
        <el-descriptions-item label="输血原因" :span="3">{{ currentRequest.transfusion_reason || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="currentRequest.auditor" label="审核人">{{ currentRequest.auditor }}</el-descriptions-item>
        <el-descriptions-item v-if="currentRequest.audit_time" label="审核时间">{{ currentRequest.audit_time }}</el-descriptions-item>
        <el-descriptions-item v-if="currentRequest.audit_remark" label="审核意见" :span="2">{{ currentRequest.audit_remark }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ currentRequest.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left" v-if="currentRequest?.issues?.length > 0">发血记录</el-divider>
      <el-table :data="currentRequest?.issues || []" size="small" border v-if="currentRequest?.issues?.length > 0">
        <el-table-column prop="issue_no" label="发血单号" width="140" />
        <el-table-column prop="issue_date" label="发血时间" width="160" />
        <el-table-column prop="issuer" label="发血人" width="100" />
        <el-table-column prop="receiver" label="取血人" width="100" />
        <el-table-column prop="total_volume" label="发血量(ml)" width="110" />
        <el-table-column prop="item_count" label="袋数" width="70" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === '已使用' ? 'success' : 'primary'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="row.status === '已发血'" type="success" text size="small" @click="handleReceive(row)">确认接收</el-button>
            <el-button v-if="row.status === '已接收'" type="primary" text size="small" @click="handleComplete(row)">完成输血</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="auditVisible" title="审核申请" width="500px">
      <el-form :model="auditForm" :rules="auditRules" ref="auditFormRef" label-width="80px">
        <el-form-item label="审核结果" prop="pass">
          <el-radio-group v-model="auditForm.pass">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核人">
          <el-input v-model="auditForm.auditor" placeholder="请输入审核人姓名" />
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="auditForm.audit_remark" type="textarea" :rows="3" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit" :loading="auditing">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="issueVisible" title="配血发血" width="800px" @close="resetIssueForm">
      <div v-if="matchData.request" style="margin-bottom: 20px">
        <el-descriptions :column="3" size="small" border>
          <el-descriptions-item label="申请单号">{{ matchData.request.request_no }}</el-descriptions-item>
          <el-descriptions-item label="患者血型">{{ matchData.request.patient_blood_type }}型</el-descriptions-item>
          <el-descriptions-item label="RH因子">{{ matchData.request.rh_factor }}</el-descriptions-item>
          <el-descriptions-item label="成分类型">{{ matchData.request.component_type }}</el-descriptions-item>
          <el-descriptions-item label="申请量">{{ matchData.request.request_volume }}ml</el-descriptions-item>
          <el-descriptions-item label="申请袋数">{{ matchData.request.request_units }}袋</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-divider content-position="left">匹配的库存血液（可多选）</el-divider>
      
      <el-table :data="matchData.matched_blood || []" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="blood_no" label="血液编号" width="150" />
        <el-table-column prop="blood_type" label="血型" width="70" />
        <el-table-column prop="rh_factor" label="RH因子" width="80" />
        <el-table-column prop="component_type" label="成分" width="100" />
        <el-table-column prop="volume" label="血量(ml)" width="90" />
        <el-table-column prop="storage_location" label="库位" width="140" />
        <el-table-column prop="expire_date" label="过期日期" width="120" />
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag :type="getDaysLeftType(row.days_left)" size="small">
              {{ row.days_left > 0 ? row.days_left + '天' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="issue-summary">
        <span>已选 <b>{{ selectedBlood.length }}</b> 袋，共 <b>{{ selectedTotalVolume }}</b> ml</span>
      </div>

      <el-form :model="issueForm" label-width="80px" style="margin-top: 20px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发血人">
              <el-input v-model="issueForm.issuer" placeholder="请输入发血人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="取血人">
              <el-input v-model="issueForm.receiver" placeholder="请输入取血人姓名" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="issueVisible = false">取消</el-button>
        <el-button type="primary" @click="submitIssue" :loading="issuing" :disabled="selectedBlood.length === 0">
          确认发血
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'

const loading = ref(false)
const auditing = ref(false)
const issuing = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const detailVisible = ref(false)
const auditVisible = ref(false)
const issueVisible = ref(false)
const currentRequest = ref(null)
const currentRequestId = ref(null)

const auditFormRef = ref(null)
const selectedBlood = ref([])
const matchData = ref({})

const searchForm = ref({
  keyword: '',
  status: '',
  blood_type: '',
  urgency: ''
})

const auditForm = reactive({
  pass: true,
  auditor: '',
  audit_remark: ''
})

const issueForm = reactive({
  issuer: '',
  receiver: '',
  issue_date: new Date().toISOString().split('T')[0]
})

const auditRules = {
  pass: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  auditor: [{ required: true, message: '请输入审核人', trigger: 'blur' }]
}

const selectedTotalVolume = computed(() => {
  return selectedBlood.value.reduce((sum, item) => sum + item.volume, 0)
})

const getStatusType = (status) => {
  const types = {
    '待审核': 'warning',
    '已审核': 'info',
    '配血中': 'primary',
    '已发血': 'success',
    '部分发血': 'warning',
    '已完成': 'success',
    '已取消': 'danger'
  }
  return types[status] || 'info'
}

const getUrgencyType = (urgency) => {
  const types = {
    '常规': 'info',
    '加急': 'warning',
    '紧急': 'danger'
  }
  return types[urgency] || 'info'
}

const getDaysLeftType = (days) => {
  if (days <= 0) return 'danger'
  if (days <= 3) return 'danger'
  if (days <= 7) return 'warning'
  return 'success'
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await api.getRequests({
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
  searchForm.value = { keyword: '', status: '', blood_type: '', urgency: '' }
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

const viewDetail = async (row) => {
  try {
    const data = await api.getRequestDetail(row.id)
    currentRequest.value = data
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const handleAudit = (row) => {
  currentRequestId.value = row.id
  auditForm.pass = true
  auditForm.auditor = ''
  auditForm.audit_remark = ''
  auditVisible.value = true
}

const submitAudit = () => {
  auditFormRef.value.validate(async (valid) => {
    if (valid) {
      auditing.value = true
      try {
        await api.auditRequest(currentRequestId.value, auditForm)
        ElMessage.success('审核成功')
        auditVisible.value = false
        fetchList()
      } catch (e) {
        console.error(e)
      } finally {
        auditing.value = false
      }
    }
  })
}

const handleIssue = async (row) => {
  currentRequestId.value = row.id
  issueForm.issuer = ''
  issueForm.receiver = ''
  selectedBlood.value = []
  try {
    const data = await api.getMatchBlood(row.id)
    matchData.value = data
    issueVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const handleSelectionChange = (selection) => {
  selectedBlood.value = selection
}

const resetIssueForm = () => {
  selectedBlood.value = []
  matchData.value = {}
}

const submitIssue = async () => {
  if (selectedBlood.value.length === 0) {
    ElMessage.warning('请选择要发放的血液')
    return
  }
  if (!issueForm.issuer || !issueForm.receiver) {
    ElMessage.warning('请填写发血人和取血人')
    return
  }
  
  ElMessageBox.confirm(`确认发放 ${selectedBlood.value.length} 袋血液，共 ${selectedTotalVolume.value} ml？`, '确认发血', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    issuing.value = true
    try {
      const inventoryIds = selectedBlood.value.map(item => item.id)
      await api.issueBlood(currentRequestId.value, {
        inventory_ids: inventoryIds,
        ...issueForm
      })
      ElMessage.success('发血成功')
      issueVisible.value = false
      fetchList()
    } catch (e) {
      console.error(e)
    } finally {
      issuing.value = false
    }
  }).catch(() => {})
}

const handleReceive = (row) => {
  ElMessageBox.confirm('确认医院已接收血液？', '确认接收', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await api.receiveBlood(row.id, { receiver: row.receiver })
      ElMessage.success('已确认接收')
      viewDetail({ id: currentRequest.value.id })
      fetchList()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const handleComplete = (row) => {
  ElMessageBox.confirm('确认输血已完成？', '确认完成', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    try {
      await api.completeTransfusion(row.id, { operator: '系统' })
      ElMessage.success('输血完成')
      viewDetail({ id: currentRequest.value.id })
      fetchList()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.blood-requests {
  padding: 0;
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

.issue-summary {
  margin-top: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  text-align: right;
}

.issue-summary b {
  color: #409EFF;
  font-size: 16px;
}
</style>
