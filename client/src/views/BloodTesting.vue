<template>
  <div class="blood-testing">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待检测" name="pending">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待检测血液列表</span>
              <el-button type="primary" @click="refreshPending">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table :data="pendingList" border stripe v-loading="loading">
            <el-table-column prop="blood_no" label="血液编号" width="150" />
            <el-table-column prop="donor_name" label="献血者" width="100" />
            <el-table-column prop="blood_type" label="血型" width="70" />
            <el-table-column prop="component_type" label="成分" width="100" />
            <el-table-column prop="volume" label="血量(ml)" width="90" />
            <el-table-column prop="collection_site" label="采集地点" show-overflow-tooltip />
            <el-table-column prop="collection_date" label="采集日期" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '检测中' ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openTestForm(row)">
                  录入结果
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingList.length === 0 && !loading" description="暂无待检测血液" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="检测记录" name="history">
        <el-card class="search-card">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="关键词">
              <el-input v-model="searchForm.keyword" placeholder="血液编号/献血者" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="结果">
              <el-select v-model="searchForm.overall_result" placeholder="全部" clearable style="width: 100px">
                <el-option label="合格" value="合格" />
                <el-option label="不合格" value="不合格" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchTestList">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card>
          <el-table :data="testList" border stripe v-loading="loading">
            <el-table-column prop="blood_no" label="血液编号" width="150" />
            <el-table-column prop="donor_name" label="献血者" width="100" />
            <el-table-column prop="blood_type" label="血型" width="70" />
            <el-table-column prop="component_type" label="成分" width="100" />
            <el-table-column prop="alt_level" label="转氨酶(U/L)" width="110" />
            <el-table-column prop="alt_result" label="转氨酶结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.alt_result === '合格' ? 'success' : 'danger'" size="small">
                  {{ row.alt_result }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="test_date" label="检测日期" width="120" />
            <el-table-column prop="tester" label="检测人员" width="100" />
            <el-table-column prop="overall_result" label="总结果" width="90">
              <template #default="{ row }">
                <el-tag :type="row.overall_result === '合格' ? 'success' : 'danger'" size="small">
                  {{ row.overall_result }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="viewTestDetail(row)">详情</el-button>
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
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="testFormVisible" title="录入检测结果" width="700px" @close="resetTestForm">
      <div v-if="currentBlood" style="margin-bottom: 20px">
        <el-descriptions :column="3" size="small" border>
          <el-descriptions-item label="血液编号">{{ currentBlood.blood_no }}</el-descriptions-item>
          <el-descriptions-item label="献血者">{{ currentBlood.donor_name }}</el-descriptions-item>
          <el-descriptions-item label="血量">{{ currentBlood.volume }}ml</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form :model="testForm" :rules="testRules" ref="testFormRef" label-width="120px">
        <el-divider content-position="left">血型鉴定</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="ABO血型" prop="blood_type">
              <el-select v-model="testForm.blood_type" style="width: 100%">
                <el-option label="A型" value="A" />
                <el-option label="B型" value="B" />
                <el-option label="AB型" value="AB" />
                <el-option label="O型" value="O" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="RH因子" prop="rh_factor">
              <el-select v-model="testForm.rh_factor" style="width: 100%">
                <el-option label="阳性" value="阳性" />
                <el-option label="阴性" value="阴性" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">生化检测</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="转氨酶ALT" prop="alt_level">
              <el-input-number v-model="testForm.alt_level" :min="0" :max="200" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ALT结果" prop="alt_result">
              <el-select v-model="testForm.alt_result" style="width: 100%">
                <el-option label="合格" value="合格" />
                <el-option label="不合格" value="不合格" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">传染病筛查</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="乙肝表面抗原" prop="hbsag">
              <el-radio-group v-model="testForm.hbsag">
                <el-radio label="阴性">阴性</el-radio>
                <el-radio label="阳性">阳性</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="丙肝抗体" prop="hcv">
              <el-radio-group v-model="testForm.hcv">
                <el-radio label="阴性">阴性</el-radio>
                <el-radio label="阳性">阳性</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="艾滋病抗体" prop="hiv">
              <el-radio-group v-model="testForm.hiv">
                <el-radio label="阴性">阴性</el-radio>
                <el-radio label="阳性">阳性</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="梅毒抗体" prop="syphilis">
              <el-radio-group v-model="testForm.syphilis">
                <el-radio label="阴性">阴性</el-radio>
                <el-radio label="阳性">阳性</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">总体结果</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检测日期" prop="test_date">
              <el-date-picker v-model="testForm.test_date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测人员" prop="tester">
              <el-input v-model="testForm.tester" placeholder="请输入检测人员姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="总体结果" prop="overall_result">
          <el-radio-group v-model="testForm.overall_result">
            <el-radio label="合格" border>合格</el-radio>
            <el-radio label="不合格" border>不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="testForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="testFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTestResult" :loading="submitting">提交结果</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="检测详情" width="600px">
      <el-descriptions :column="2" border v-if="currentTest">
        <el-descriptions-item label="血液编号">{{ currentTest.blood_no }}</el-descriptions-item>
        <el-descriptions-item label="献血者">{{ currentTest.donor_name }}</el-descriptions-item>
        <el-descriptions-item label="ABO血型">{{ currentTest.blood_type }}型</el-descriptions-item>
        <el-descriptions-item label="RH因子">{{ currentTest.rh_factor }}</el-descriptions-item>
        <el-descriptions-item label="转氨酶ALT">{{ currentTest.alt_level }} U/L</el-descriptions-item>
        <el-descriptions-item label="ALT结果">
          <el-tag :type="currentTest.alt_result === '合格' ? 'success' : 'danger'" size="small">
            {{ currentTest.alt_result }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="乙肝表面抗原">
          <el-tag :type="currentTest.hbsag === '阴性' ? 'success' : 'danger'" size="small">
            {{ currentTest.hbsag }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="丙肝抗体">
          <el-tag :type="currentTest.hcv === '阴性' ? 'success' : 'danger'" size="small">
            {{ currentTest.hcv }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="艾滋病抗体">
          <el-tag :type="currentTest.hiv === '阴性' ? 'success' : 'danger'" size="small">
            {{ currentTest.hiv }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="梅毒抗体">
          <el-tag :type="currentTest.syphilis === '阴性' ? 'success' : 'danger'" size="small">
            {{ currentTest.syphilis }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="检测日期">{{ currentTest.test_date }}</el-descriptions-item>
        <el-descriptions-item label="检测人员">{{ currentTest.tester }}</el-descriptions-item>
        <el-descriptions-item label="总体结果" :span="2">
          <el-tag :type="currentTest.overall_result === '合格' ? 'success' : 'danger'">
            {{ currentTest.overall_result }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentTest.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api'

const activeTab = ref('pending')
const loading = ref(false)
const submitting = ref(false)

const pendingList = ref([])
const testList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const testFormVisible = ref(false)
const detailVisible = ref(false)
const currentBlood = ref(null)
const currentTest = ref(null)
const testFormRef = ref(null)

const searchForm = ref({
  keyword: '',
  overall_result: ''
})

const testForm = reactive({
  blood_unit_id: null,
  blood_no: '',
  test_date: new Date().toISOString().split('T')[0],
  tester: '',
  blood_type: 'A',
  rh_factor: '阳性',
  alt_level: 25,
  alt_result: '合格',
  hbsag: '阴性',
  hcv: '阴性',
  hiv: '阴性',
  syphilis: '阴性',
  overall_result: '合格',
  test_items: '',
  remark: ''
})

const testRules = {
  blood_type: [{ required: true, message: '请选择血型', trigger: 'change' }],
  rh_factor: [{ required: true, message: '请选择RH因子', trigger: 'change' }],
  alt_level: [{ required: true, message: '请输入转氨酶值', trigger: 'blur' }],
  alt_result: [{ required: true, message: '请选择ALT结果', trigger: 'change' }],
  hbsag: [{ required: true, message: '请选择乙肝结果', trigger: 'change' }],
  hcv: [{ required: true, message: '请选择丙肝结果', trigger: 'change' }],
  hiv: [{ required: true, message: '请选择艾滋结果', trigger: 'change' }],
  syphilis: [{ required: true, message: '请选择梅毒结果', trigger: 'change' }],
  test_date: [{ required: true, message: '请选择检测日期', trigger: 'change' }],
  tester: [{ required: true, message: '请输入检测人员', trigger: 'blur' }],
  overall_result: [{ required: true, message: '请选择总体结果', trigger: 'change' }]
}

const refreshPending = () => {
  fetchPendingList()
}

const fetchPendingList = async () => {
  loading.value = true
  try {
    const data = await api.getPendingTests()
    pendingList.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchTestList = async () => {
  loading.value = true
  try {
    const data = await api.getTestList({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    })
    testList.value = data.list
    total.value = data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.value = { keyword: '', overall_result: '' }
  currentPage.value = 1
  fetchTestList()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchTestList()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchTestList()
}

const openTestForm = (row) => {
  currentBlood.value = row
  testForm.blood_unit_id = row.id
  testForm.blood_no = row.blood_no
  if (row.blood_type && row.blood_type !== '未知') {
    testForm.blood_type = row.blood_type
  }
  if (row.rh_factor && row.rh_factor !== '未知') {
    testForm.rh_factor = row.rh_factor
  }
  testFormVisible.value = true
}

const resetTestForm = () => {
  testFormRef.value?.clearValidate()
  testForm.blood_unit_id = null
  testForm.blood_no = ''
  testForm.test_date = new Date().toISOString().split('T')[0]
  testForm.tester = ''
  testForm.blood_type = 'A'
  testForm.rh_factor = '阳性'
  testForm.alt_level = 25
  testForm.alt_result = '合格'
  testForm.hbsag = '阴性'
  testForm.hcv = '阴性'
  testForm.hiv = '阴性'
  testForm.syphilis = '阴性'
  testForm.overall_result = '合格'
  testForm.remark = ''
  currentBlood.value = null
}

const submitTestResult = () => {
  testFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.submitTestResult(testForm)
        ElMessage.success('检测结果提交成功')
        testFormVisible.value = false
        fetchPendingList()
        if (activeTab.value === 'history') {
          fetchTestList()
        }
      } catch (e) {
        console.error(e)
      } finally {
        submitting.value = false
      }
    }
  })
}

const viewTestDetail = async (row) => {
  try {
    const data = await api.getTestDetail(row.id)
    currentTest.value = data
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchPendingList()
})
</script>

<style scoped>
.blood-testing {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-card {
  margin-bottom: 15px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-tabs__content) {
  padding-top: 10px;
}
</style>
