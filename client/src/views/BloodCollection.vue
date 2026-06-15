<template>
  <div class="blood-collection">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>血液采集登记</span>
        </div>
      </template>

      <el-steps :active="step" finish-status="success" class="steps">
        <el-step title="选择献血者" />
        <el-step title="采集信息" />
        <el-step title="确认提交" />
      </el-steps>

      <div v-if="step === 0" class="step-content">
        <el-alert
          title="请先搜索并选择献血者"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form :inline="true" @submit.prevent>
          <el-form-item label="搜索献血者">
            <el-input
              v-model="searchKeyword"
              placeholder="输入编号/姓名/身份证号搜索"
              style="width: 300px"
              clearable
              @clear="searchResults = []"
            >
              <template #append>
                <el-button @click="searchDonor">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>

        <el-table
          v-if="searchResults.length > 0"
          :data="searchResults"
          border
          style="margin-top: 15px"
          highlight-current-row
          @row-click="selectDonor"
        >
          <el-table-column prop="donor_no" label="献血者编号" width="120" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="gender" label="性别" width="60" />
          <el-table-column prop="age" label="年龄" width="60" />
          <el-table-column prop="blood_type" label="血型" width="70" />
          <el-table-column prop="rh_factor" label="RH" width="70" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="donate_count" label="献血次数" width="90" />
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="selectDonor(row)">选择</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">新增献血者</el-divider>
        <el-button type="success" @click="showNewDonor = true">
          <el-icon><Plus /></el-icon>
          新增献血者登记
        </el-button>
      </div>

      <div v-if="step === 1" class="step-content">
        <el-descriptions :column="3" border style="margin-bottom: 20px">
          <el-descriptions-item label="献血者编号">{{ selectedDonor.donor_no }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedDonor.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ selectedDonor.gender }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ selectedDonor.age }}岁</el-descriptions-item>
          <el-descriptions-item label="血型">{{ selectedDonor.blood_type }}型</el-descriptions-item>
          <el-descriptions-item label="RH因子">{{ selectedDonor.rh_factor }}</el-descriptions-item>
        </el-descriptions>

        <el-form :model="collectionForm" :rules="collectionRules" ref="collectionFormRef" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="采集地点" prop="collection_site">
                <el-select v-model="collectionForm.collection_site" style="width: 100%">
                  <el-option label="中心献血站" value="中心献血站" />
                  <el-option label="流动采血车1号" value="流动采血车1号" />
                  <el-option label="流动采血车2号" value="流动采血车2号" />
                  <el-option label="东城区献血屋" value="东城区献血屋" />
                  <el-option label="西城区献血屋" value="西城区献血屋" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="采血护士" prop="collector">
                <el-input v-model="collectionForm.collector" placeholder="请输入采血护士姓名" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="采集日期" prop="collection_date">
                <el-date-picker
                  v-model="collectionForm.collection_date"
                  type="date"
                  placeholder="选择日期"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="采集时间" prop="collection_time">
                <el-time-picker
                  v-model="collectionForm.collection_time"
                  placeholder="选择时间"
                  style="width: 100%"
                  value-format="HH:mm:ss"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="献血量(ml)" prop="volume">
                <el-radio-group v-model="collectionForm.volume">
                  <el-radio :label="200">200ml</el-radio>
                  <el-radio :label="300">300ml</el-radio>
                  <el-radio :label="400">400ml</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="血液成分" prop="component_type">
                <el-select v-model="collectionForm.component_type" style="width: 100%">
                  <el-option label="全血" value="全血" />
                  <el-option label="红细胞" value="红细胞" />
                  <el-option label="血小板" value="血小板" />
                  <el-option label="血浆" value="血浆" />
                  <el-option label="冷沉淀" value="冷沉淀" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注">
            <el-input v-model="collectionForm.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
          </el-form-item>
        </el-form>

        <div class="step-actions">
          <el-button @click="step = 0">上一步</el-button>
          <el-button type="primary" @click="goToConfirm">下一步</el-button>
        </div>
      </div>

      <div v-if="step === 2" class="step-content">
        <el-result icon="info" title="请确认采集信息">
          <template #sub-title>
            <div class="confirm-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="献血者编号">{{ selectedDonor.donor_no }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ selectedDonor.name }}</el-descriptions-item>
                <el-descriptions-item label="采集地点">{{ collectionForm.collection_site }}</el-descriptions-item>
                <el-descriptions-item label="采血护士">{{ collectionForm.collector }}</el-descriptions-item>
                <el-descriptions-item label="采集日期">{{ collectionForm.collection_date }}</el-descriptions-item>
                <el-descriptions-item label="采集时间">{{ collectionForm.collection_time }}</el-descriptions-item>
                <el-descriptions-item label="献血量">{{ collectionForm.volume }}ml</el-descriptions-item>
                <el-descriptions-item label="血液成分">{{ collectionForm.component_type }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
          <template #extra>
            <div class="step-actions">
              <el-button @click="step = 1">返回修改</el-button>
              <el-button type="primary" @click="submitCollection" :loading="submitting">
                确认提交
              </el-button>
            </div>
          </template>
        </el-result>
      </div>
    </el-card>

    <el-dialog v-model="showNewDonor" title="新增献血者" width="600px">
      <el-form :model="newDonorForm" :rules="newDonorRules" ref="newDonorFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="献血者编号" prop="donor_no">
              <el-input v-model="newDonorForm.donor_no" placeholder="请输入编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="newDonorForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="newDonorForm.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="newDonorForm.age" :min="18" :max="60" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="newDonorForm.id_card" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="newDonorForm.phone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="住址" prop="address">
          <el-input v-model="newDonorForm.address" placeholder="请输入住址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewDonor = false">取消</el-button>
        <el-button type="primary" @click="addNewDonor" :loading="addingDonor">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const step = ref(0)
const searchKeyword = ref('')
const searchResults = ref([])
const selectedDonor = ref(null)
const submitting = ref(false)
const showNewDonor = ref(false)
const addingDonor = ref(false)

const collectionFormRef = ref(null)
const newDonorFormRef = ref(null)

const collectionForm = reactive({
  collection_site: '中心献血站',
  collector: '',
  collection_date: new Date().toISOString().split('T')[0],
  collection_time: '09:00:00',
  volume: 400,
  component_type: '全血',
  remark: ''
})

const collectionRules = {
  collection_site: [{ required: true, message: '请选择采集地点', trigger: 'change' }],
  collector: [{ required: true, message: '请输入采血护士', trigger: 'blur' }],
  collection_date: [{ required: true, message: '请选择采集日期', trigger: 'change' }],
  collection_time: [{ required: true, message: '请选择采集时间', trigger: 'change' }],
  volume: [{ required: true, message: '请选择献血量', trigger: 'change' }]
}

const newDonorForm = reactive({
  donor_no: '',
  name: '',
  gender: '男',
  age: 25,
  id_card: '',
  phone: '',
  address: ''
})

const newDonorRules = {
  donor_no: [{ required: true, message: '请输入献血者编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  id_card: [{ required: true, message: '请输入身份证号', trigger: 'blur' }]
}

const searchDonor = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  try {
    const data = await api.searchDonor(searchKeyword.value)
    searchResults.value = data
    if (data.length === 0) {
      ElMessage.info('未找到匹配的献血者')
    }
  } catch (e) {
    console.error(e)
  }
}

const selectDonor = (row) => {
  selectedDonor.value = row
  step.value = 1
}

const addNewDonor = async () => {
  newDonorFormRef.value.validate(async (valid) => {
    if (valid) {
      addingDonor.value = true
      try {
        const data = await api.addDonor({
          ...newDonorForm,
          blood_type: '未知',
          rh_factor: '未知',
          status: '正常'
        })
        ElMessage.success('献血者登记成功')
        showNewDonor.value = false
        selectedDonor.value = { ...newDonorForm, id: data.id, blood_type: '未知', rh_factor: '未知' }
        step.value = 1
      } catch (e) {
        console.error(e)
      } finally {
        addingDonor.value = false
      }
    }
  })
}

const goToConfirm = () => {
  collectionFormRef.value.validate((valid) => {
    if (valid) {
      step.value = 2
    }
  })
}

const submitCollection = async () => {
  submitting.value = true
  try {
    await api.addBloodCollection({
      donor_id: selectedDonor.value.id,
      donor_no: selectedDonor.value.donor_no,
      donor_name: selectedDonor.value.name,
      blood_type: selectedDonor.value.blood_type,
      rh_factor: selectedDonor.value.rh_factor,
      ...collectionForm
    })
    ElMessage.success('采集登记成功')
    step.value = 0
    searchKeyword.value = ''
    searchResults.value = []
    selectedDonor.value = null
    collectionForm.volume = 400
    collectionForm.remark = ''
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.blood-collection {
  padding: 0;
}

.steps {
  margin-bottom: 30px;
  padding: 20px 100px;
}

.step-content {
  padding: 20px;
  min-height: 300px;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.card-header {
  font-weight: 600;
  color: #303133;
}

.confirm-info {
  width: 500px;
  margin: 0 auto;
}
</style>
