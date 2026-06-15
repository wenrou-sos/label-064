<template>
  <div class="request-new">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新建用血申请</span>
          <el-button @click="$router.back()">
            <el-icon><Back /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-form :model="requestForm" :rules="rules" ref="requestFormRef" label-width="120px" class="request-form">
        <el-divider content-position="left">医院信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="医院" prop="hospital_id">
              <el-select v-model="requestForm.hospital_id" style="width: 100%" @change="handleHospitalChange">
                <el-option
                  v-for="item in hospitalList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急程度" prop="urgency">
              <el-select v-model="requestForm.urgency" style="width: 100%">
                <el-option label="常规" value="常规" />
                <el-option label="加急" value="加急" />
                <el-option label="紧急" value="紧急" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">患者信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="患者姓名" prop="patient_name">
              <el-input v-model="requestForm.patient_name" placeholder="请输入患者姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别" prop="patient_gender">
              <el-radio-group v-model="requestForm.patient_gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年龄">
              <el-input-number v-model="requestForm.patient_age" :min="0" :max="120" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="ABO血型" prop="patient_blood_type">
              <el-select v-model="requestForm.patient_blood_type" style="width: 100%">
                <el-option label="A型" value="A" />
                <el-option label="B型" value="B" />
                <el-option label="AB型" value="AB" />
                <el-option label="O型" value="O" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="RH因子" prop="rh_factor">
              <el-select v-model="requestForm.rh_factor" style="width: 100%">
                <el-option label="阳性" value="阳性" />
                <el-option label="阴性" value="阴性" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="申请医生">
              <el-input v-model="requestForm.requester" placeholder="请输入申请医生" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">用血信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="血液成分" prop="component_type">
              <el-select v-model="requestForm.component_type" style="width: 100%">
                <el-option label="全血" value="全血" />
                <el-option label="红细胞" value="红细胞" />
                <el-option label="血小板" value="血小板" />
                <el-option label="血浆" value="血浆" />
                <el-option label="冷沉淀" value="冷沉淀" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="申请血量(ml)" prop="request_volume">
              <el-input-number v-model="requestForm.request_volume" :min="100" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="申请袋数">
              <el-input-number v-model="requestForm.request_units" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="临床诊断">
              <el-input v-model="requestForm.clinical_diagnosis" placeholder="请输入临床诊断" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请日期">
              <el-date-picker v-model="requestForm.request_date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="输血原因">
          <el-input v-model="requestForm.transfusion_reason" type="textarea" :rows="3" placeholder="请输入输血原因" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="requestForm.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
        </el-form-item>

        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" @click="submitRequest" :loading="submitting">
            提交申请
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const router = useRouter()

const submitting = ref(false)
const hospitalList = ref([])
const requestFormRef = ref(null)

const requestForm = reactive({
  hospital_id: null,
  hospital_name: '',
  patient_name: '',
  patient_gender: '男',
  patient_age: 30,
  patient_blood_type: 'A',
  rh_factor: '阳性',
  component_type: '全血',
  request_volume: 400,
  request_units: 1,
  urgency: '常规',
  clinical_diagnosis: '',
  transfusion_reason: '',
  requester: '',
  request_date: new Date().toISOString().split('T')[0],
  remark: ''
})

const rules = {
  hospital_id: [{ required: true, message: '请选择医院', trigger: 'change' }],
  patient_name: [{ required: true, message: '请输入患者姓名', trigger: 'blur' }],
  patient_blood_type: [{ required: true, message: '请选择血型', trigger: 'change' }],
  component_type: [{ required: true, message: '请选择血液成分', trigger: 'change' }],
  request_volume: [{ required: true, message: '请输入申请血量', trigger: 'blur' }],
  urgency: [{ required: true, message: '请选择紧急程度', trigger: 'change' }]
}

const fetchHospitals = async () => {
  try {
    const data = await api.getHospitals()
    hospitalList.value = data
  } catch (e) {
    console.error(e)
  }
}

const handleHospitalChange = (value) => {
  const hospital = hospitalList.value.find(h => h.id === value)
  if (hospital) {
    requestForm.hospital_name = hospital.name
  }
}

const submitRequest = () => {
  requestFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.createRequest(requestForm)
        ElMessage.success('申请提交成功')
        router.push('/requests')
      } catch (e) {
        console.error(e)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchHospitals()
})
</script>

<style scoped>
.request-new {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-form {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 0;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
}

.form-actions .el-button {
  margin: 0 10px;
  min-width: 120px;
}
</style>
