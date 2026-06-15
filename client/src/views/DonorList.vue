<template>
  <div class="donor-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="姓名/编号/电话/身份证" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="血型">
          <el-select v-model="searchForm.blood_type" placeholder="全部" clearable style="width: 120px">
            <el-option label="A型" value="A" />
            <el-option label="B型" value="B" />
            <el-option label="AB型" value="AB" />
            <el-option label="O型" value="O" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" value="正常" />
            <el-option label="暂缓" value="暂缓" />
            <el-option label="永久淘汰" value="永久淘汰" />
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
          <span>献血者列表</span>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            新增献血者
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="donor_no" label="献血者编号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="age" label="年龄" width="60" />
        <el-table-column prop="blood_type" label="血型" width="70" />
        <el-table-column prop="rh_factor" label="RH因子" width="80" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="donate_count" label="献血次数" width="90" />
        <el-table-column prop="total_donate_volume" label="累计献血量(ml)" width="130" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : row.status === '暂缓' ? 'warning' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" text size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="resetForm">
      <el-form :model="donorForm" :rules="rules" ref="donorFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="献血者编号" prop="donor_no">
              <el-input v-model="donorForm.donor_no" :disabled="isEdit" placeholder="自动生成或手动输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="donorForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="donorForm.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="donorForm.age" :min="18" :max="60" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="donorForm.id_card" placeholder="请输入身份证号" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="donorForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="血型" prop="blood_type">
              <el-select v-model="donorForm.blood_type" style="width: 100%">
                <el-option label="未知" value="未知" />
                <el-option label="A型" value="A" />
                <el-option label="B型" value="B" />
                <el-option label="AB型" value="AB" />
                <el-option label="O型" value="O" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="RH因子" prop="rh_factor">
              <el-select v-model="donorForm.rh_factor" style="width: 100%">
                <el-option label="未知" value="未知" />
                <el-option label="阳性" value="阳性" />
                <el-option label="阴性" value="阴性" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="住址" prop="address">
          <el-input v-model="donorForm.address" placeholder="请输入住址" />
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态" prop="status">
          <el-select v-model="donorForm.status" style="width: 100%">
            <el-option label="正常" value="正常" />
            <el-option label="暂缓" value="暂缓" />
            <el-option label="永久淘汰" value="永久淘汰" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="donorForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="献血者详情" width="700px">
      <el-descriptions :column="3" border v-if="currentDonor">
        <el-descriptions-item label="献血者编号">{{ currentDonor.donor_no }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentDonor.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentDonor.gender }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ currentDonor.age }}岁</el-descriptions-item>
        <el-descriptions-item label="血型">{{ currentDonor.blood_type }}型</el-descriptions-item>
        <el-descriptions-item label="RH因子">{{ currentDonor.rh_factor }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentDonor.id_card }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDonor.phone }}</el-descriptions-item>
        <el-descriptions-item label="献血次数">{{ currentDonor.donate_count }}次</el-descriptions-item>
        <el-descriptions-item label="累计献血量" :span="2">{{ currentDonor.total_donate_volume }}ml</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentDonor.status === '正常' ? 'success' : 'warning'">
            {{ currentDonor.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="住址" :span="3">{{ currentDonor.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ currentDonor.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">献血历史</el-divider>
      <el-table :data="donationHistory" size="small" border>
        <el-table-column prop="blood_no" label="血液编号" width="140" />
        <el-table-column prop="collection_date" label="采集日期" width="120" />
        <el-table-column prop="collection_site" label="采集地点" />
        <el-table-column prop="volume" label="血量(ml)" width="100" />
        <el-table-column prop="component_type" label="成分类型" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = ref({
  keyword: '',
  blood_type: '',
  status: ''
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const currentDonor = ref(null)
const donationHistory = ref([])

const donorFormRef = ref(null)
const donorForm = ref({
  donor_no: '',
  name: '',
  gender: '男',
  age: 25,
  id_card: '',
  phone: '',
  blood_type: '未知',
  rh_factor: '未知',
  address: '',
  status: '正常',
  remark: ''
})

const rules = {
  donor_no: [{ required: true, message: '请输入献血者编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  id_card: [{ required: true, message: '请输入身份证号', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const types = {
    '待检测': 'info', '检测中': 'warning', '合格': 'success',
    '不合格': 'danger', '已入库': 'success', '已出库': 'primary',
    '已使用': 'success', '已报废': 'danger'
  }
  return types[status] || 'info'
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await api.getDonors({
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
  searchForm.value = { keyword: '', blood_type: '', status: '' }
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

const openAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增献血者'
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑献血者'
  donorForm.value = { ...row }
  dialogVisible.value = true
}

const resetForm = () => {
  donorForm.value = {
    donor_no: '',
    name: '',
    gender: '男',
    age: 25,
    id_card: '',
    phone: '',
    blood_type: '未知',
    rh_factor: '未知',
    address: '',
    status: '正常',
    remark: ''
  }
  donorFormRef.value?.clearValidate()
}

const submitForm = () => {
  donorFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          await api.updateDonor(donorForm.value.id, donorForm.value)
          ElMessage.success('更新成功')
        } else {
          await api.addDonor(donorForm.value)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchList()
      } catch (e) {
        console.error(e)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除献血者 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await api.deleteDonor(row.id)
      ElMessage.success('删除成功')
      fetchList()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const viewDetail = async (row) => {
  currentDonor.value = row
  try {
    const data = await api.getDonorDonations(row.id)
    donationHistory.value = data
  } catch (e) {
    console.error(e)
  }
  detailVisible.value = true
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.donor-list {
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

.search-form {
  margin: 0;
}
</style>
