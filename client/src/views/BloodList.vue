<template>
  <div class="blood-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="血液编号/献血者姓名/献血者编号" clearable style="width: 240px" />
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
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待检测" value="待检测" />
            <el-option label="检测中" value="检测中" />
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
            <el-option label="已入库" value="已入库" />
            <el-option label="已出库" value="已出库" />
            <el-option label="已使用" value="已使用" />
            <el-option label="已报废" value="已报废" />
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
          <span>血液记录列表</span>
          <el-button type="primary" @click="$router.push('/collection')">
            <el-icon><Plus /></el-icon>
            新增采集
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="blood_no" label="血液编号" width="150" />
        <el-table-column prop="donor_no" label="献血者编号" width="120" />
        <el-table-column prop="donor_name" label="献血者姓名" width="100" />
        <el-table-column prop="blood_type" label="血型" width="70" />
        <el-table-column prop="rh_factor" label="RH因子" width="80" />
        <el-table-column prop="component_type" label="成分类型" width="100" />
        <el-table-column prop="volume" label="血量(ml)" width="90" />
        <el-table-column prop="collection_site" label="采集地点" show-overflow-tooltip />
        <el-table-column prop="collection_date" label="采集日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" text size="small" @click="trackBlood(row)">追踪</el-button>
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

    <el-dialog v-model="detailVisible" title="血液详情" width="600px">
      <el-descriptions :column="2" border v-if="currentBlood">
        <el-descriptions-item label="血液编号">{{ currentBlood.blood_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentBlood.status)">{{ currentBlood.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="献血者编号">{{ currentBlood.donor_no }}</el-descriptions-item>
        <el-descriptions-item label="献血者姓名">{{ currentBlood.donor_name }}</el-descriptions-item>
        <el-descriptions-item label="血型">{{ currentBlood.blood_type }}型</el-descriptions-item>
        <el-descriptions-item label="RH因子">{{ currentBlood.rh_factor }}</el-descriptions-item>
        <el-descriptions-item label="成分类型">{{ currentBlood.component_type }}</el-descriptions-item>
        <el-descriptions-item label="血量">{{ currentBlood.volume }}ml</el-descriptions-item>
        <el-descriptions-item label="采集地点">{{ currentBlood.collection_site }}</el-descriptions-item>
        <el-descriptions-item label="采集日期">{{ currentBlood.collection_date }}</el-descriptions-item>
        <el-descriptions-item label="采集时间">{{ currentBlood.collection_time }}</el-descriptions-item>
        <el-descriptions-item label="采血护士">{{ currentBlood.collector || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentBlood.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const detailVisible = ref(false)
const currentBlood = ref(null)

const searchForm = ref({
  keyword: '',
  blood_type: '',
  component_type: '',
  status: ''
})

const getStatusType = (status) => {
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

const fetchList = async () => {
  loading.value = true
  try {
    const data = await api.getBloodList({
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
  searchForm.value = { keyword: '', blood_type: '', component_type: '', status: '' }
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
    const data = await api.getBloodDetail(row.id)
    currentBlood.value = data
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const trackBlood = (row) => {
  router.push({ path: '/tracking', query: { bloodNo: row.blood_no } })
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.blood-list {
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
</style>
