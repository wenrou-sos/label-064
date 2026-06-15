import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { getToken, removeToken, removeUserInfo } from '../utils/auth'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

service.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401) {
        removeToken()
        removeUserInfo()
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  error => {
    console.error('请求错误:', error)
    if (error.response && error.response.status === 401) {
      removeToken()
      removeUserInfo()
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const api = {
  login: (data) => service.post('/auth/login', data),
  logout: () => service.post('/auth/logout'),
  getDonors: (params) => service.get('/donors', { params }),
  getDonor: (id) => service.get(`/donors/${id}`),
  addDonor: (data) => service.post('/donors', data),
  updateDonor: (id, data) => service.put(`/donors/${id}`, data),
  deleteDonor: (id) => service.delete(`/donors/${id}`),
  getDonorDonations: (id) => service.get(`/donors/${id}/donations`),
  searchDonor: (keyword) => service.get('/blood/search/donor', { params: { keyword } }),

  getBloodList: (params) => service.get('/blood', { params }),
  getBloodDetail: (id) => service.get(`/blood/${id}`),
  addBloodCollection: (data) => service.post('/blood', data),
  updateBlood: (id, data) => service.put(`/blood/${id}`, data),

  getTestList: (params) => service.get('/tests', { params }),
  getTestDetail: (id) => service.get(`/tests/${id}`),
  getPendingTests: () => service.get('/tests/pending/list'),
  submitTestResult: (data) => service.post('/tests', data),
  updateTestResult: (id, data) => service.put(`/tests/${id}`, data),

  getInventory: (params) => service.get('/inventory', { params }),
  getInventoryStats: () => service.get('/inventory/stats/summary'),
  getExpiringSoon: (days) => service.get('/inventory/expiring-soon', { params: { days } }),
  getPendingStock: () => service.get('/inventory/pending-stock/list'),
  getInventoryDetail: (id) => service.get(`/inventory/${id}`),
  stockIn: (data) => service.post('/inventory/stock-in', data),
  discardBlood: (data) => service.post('/inventory/discard', data),

  getRequests: (params) => service.get('/requests', { params }),
  getRequestDetail: (id) => service.get(`/requests/${id}`),
  createRequest: (data) => service.post('/requests', data),
  auditRequest: (id, data) => service.post(`/requests/${id}/audit`, data),
  getMatchBlood: (id) => service.get(`/requests/${id}/match-blood`),
  issueBlood: (id, data) => service.post(`/requests/${id}/issue`, data),
  receiveBlood: (issueId, data) => service.post(`/requests/issue/${issueId}/receive`, data),
  completeTransfusion: (issueId, data) => service.post(`/requests/issue/${issueId}/complete`, data),
  getHospitals: () => service.get('/requests/hospitals/list'),

  getDashboardStats: () => service.get('/dashboard/stats'),
  trackBlood: (bloodNo) => service.get(`/dashboard/track/${bloodNo}`)
}

export default service
