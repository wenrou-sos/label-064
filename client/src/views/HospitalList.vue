<template>
  <div class="hospital-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>医院列表</span>
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            新增医院
          </el-button>
        </div>
      </template>

      <el-table :data="hospitalList" border stripe v-loading="loading">
        <el-table-column prop="hospital_no" label="医院编号" width="120" />
        <el-table-column prop="name" label="医院名称" min-width="200" />
        <el-table-column prop="level" label="医院等级" width="120" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small">编辑</el-button>
            <el-button type="danger" text size="small">停用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const loading = ref(false)
const hospitalList = ref([])

const fetchHospitals = async () => {
  loading.value = true
  try {
    const data = await api.getHospitals()
    hospitalList.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHospitals()
})
</script>

<style scoped>
.hospital-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
