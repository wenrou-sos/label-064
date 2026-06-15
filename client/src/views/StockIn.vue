<template>
  <div class="stock-in">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>血液入库登记</span>
          <el-button type="primary" @click="refreshPending">
            <el-icon><Refresh /></el-icon>
            刷新列表
          </el-button>
        </div>
      </template>

      <el-alert
        title="以下为检测合格、待入库的血液列表"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table :data="pendingList" border stripe v-loading="loading">
        <el-table-column prop="blood_no" label="血液编号" width="150" />
        <el-table-column prop="donor_name" label="献血者" width="100" />
        <el-table-column prop="donor_no" label="献血者编号" width="120" />
        <el-table-column prop="blood_type" label="血型" width="70" />
        <el-table-column prop="rh_factor" label="RH因子" width="80" />
        <el-table-column prop="component_type" label="成分类型" width="100" />
        <el-table-column prop="volume" label="血量(ml)" width="90" />
        <el-table-column prop="collection_site" label="采集地点" show-overflow-tooltip />
        <el-table-column prop="collection_date" label="采集日期" width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openStockIn(row)">
              入库
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="pendingList.length === 0 && !loading" description="暂无待入库血液" />
    </el-card>

    <el-dialog v-model="stockInVisible" title="血液入库" width="600px" @close="resetForm">
      <div v-if="currentBlood" style="margin-bottom: 20px">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="血液编号">{{ currentBlood.blood_no }}</el-descriptions-item>
          <el-descriptions-item label="血型">{{ currentBlood.blood_type }}型</el-descriptions-item>
          <el-descriptions-item label="RH因子">{{ currentBlood.rh_factor }}</el-descriptions-item>
          <el-descriptions-item label="成分">{{ currentBlood.component_type }}</el-descriptions-item>
          <el-descriptions-item label="血量">{{ currentBlood.volume }}ml</el-descriptions-item>
          <el-descriptions-item label="献血者">{{ currentBlood.donor_name }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form :model="stockInForm" :rules="stockInRules" ref="stockInFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="存储位置" prop="storage_location">
              <el-select v-model="stockInForm.storage_location" style="width: 100%">
                <el-option label="冷藏柜A-01" value="冷藏柜A-01" />
                <el-option label="冷藏柜A-02" value="冷藏柜A-02" />
                <el-option label="冷藏柜B-01" value="冷藏柜B-01" />
                <el-option label="冷藏柜B-02" value="冷藏柜B-02" />
                <el-option label="冷藏柜C-01" value="冷藏柜C-01" />
                <el-option label="血小板恒温柜" value="血小板恒温柜" />
                <el-option label="血浆冷冻柜" value="血浆冷冻柜" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存储温度" prop="temperature">
              <el-input-number v-model="stockInForm.temperature" :precision="1" :step="0.5" style="width: 100%">
                <template #append>℃</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库日期" prop="storage_date">
              <el-date-picker v-model="stockInForm.storage_date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保质期(天)">
              <el-input v-model="shelfLifeDays" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="操作人">
          <el-input v-model="stockInForm.operator" placeholder="请输入操作人姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockInForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="stockInVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockIn" :loading="submitting">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const SHELF_LIFE = {
  '全血': 35,
  '红细胞': 35,
  '血小板': 5,
  '血浆': 365,
  '冷沉淀': 365
}

const loading = ref(false)
const submitting = ref(false)
const pendingList = ref([])

const stockInVisible = ref(false)
const currentBlood = ref(null)
const stockInFormRef = ref(null)

const stockInForm = reactive({
  blood_unit_id: null,
  blood_no: '',
  blood_type: '',
  rh_factor: '',
  component_type: '',
  volume: 0,
  storage_location: '',
  temperature: 4.0,
  storage_date: new Date().toISOString().split('T')[0],
  operator: '',
  remark: ''
})

const stockInRules = {
  storage_location: [{ required: true, message: '请选择存储位置', trigger: 'change' }],
  storage_date: [{ required: true, message: '请选择入库日期', trigger: 'change' }]
}

const shelfLifeDays = computed(() => {
  return SHELF_LIFE[stockInForm.component_type] || 35
})

const refreshPending = () => {
  fetchPendingList()
}

const fetchPendingList = async () => {
  loading.value = true
  try {
    const data = await api.getPendingStock()
    pendingList.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openStockIn = (row) => {
  currentBlood.value = row
  stockInForm.blood_unit_id = row.id
  stockInForm.blood_no = row.blood_no
  stockInForm.blood_type = row.blood_type
  stockInForm.rh_factor = row.rh_factor
  stockInForm.component_type = row.component_type
  stockInForm.volume = row.volume
  stockInForm.storage_location = ''
  stockInForm.temperature = row.component_type === '血小板' ? 22.0 : 4.0
  stockInForm.storage_date = new Date().toISOString().split('T')[0]
  stockInForm.operator = ''
  stockInForm.remark = ''
  stockInVisible.value = true
}

const resetForm = () => {
  stockInFormRef.value?.clearValidate()
  currentBlood.value = null
}

const submitStockIn = () => {
  stockInFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.stockIn(stockInForm)
        ElMessage.success('入库成功')
        stockInVisible.value = false
        fetchPendingList()
      } catch (e) {
        console.error(e)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchPendingList()
})
</script>

<style scoped>
.stock-in {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
