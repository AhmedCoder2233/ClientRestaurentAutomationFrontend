import axios from 'axios'

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('auth_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password })

// Sale Categories
export const getSaleCategories = () => api.get('/sale-categories')
export const createSaleCategory = (data) => api.post('/sale-categories', data)
export const deleteSaleCategory = (id) => api.delete(`/sale-categories/${id}`)

// Sales
export const getSales = () => api.get('/sales')
export const createSale = (data) => api.post('/sales', data)
export const deleteSale = (id) => api.delete(`/sales/${id}`)
export const getSalesReport = (start, end) => api.get('/sales/report', { params: { start, end } })

// Daily Revenue
export const getDailyRevenue = () => api.get('/daily-revenue')
export const addDailyRevenue = (data) => api.post('/daily-revenue', data)
export const deleteRevenue = (id) => api.delete(`/daily-revenue/${id}`)

// Inventory Categories
export const getInventoryCategories = () => api.get('/inventory-categories')
export const createInventoryCategory = (data) => api.post('/inventory-categories', data)
export const deleteInventoryCategory = (id) => api.delete(`/inventory-categories/${id}`)

// Inventory
export const getInventory = () => api.get('/inventory')
export const createInventoryItem = (data) => api.post('/inventory', data)
export const updateInventoryItem = (id, data) => api.put(`/inventory/${id}`, data)
export const deleteInventoryItem = (id) => api.delete(`/inventory/${id}`)
export const getInventoryReport = (start, end) => api.get('/inventory/report', { params: { start, end } })

// Inventory Receipts
export const getInventoryReceipts = (item_id) => api.get('/inventory-receipts', { params: { item_id } })
export const addInventoryReceipt = (data) => api.post('/inventory-receipts', data)

// Expenses
export const getExpenses = () => api.get('/expenses')
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)

// Employees
export const getEmployees = () => api.get('/employees')
export const createEmployee = (data) => api.post('/employees', data)
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data)
export const deleteEmployee = (id) => api.delete(`/employees/${id}`)

// Payroll
export const getPayments = () => api.get('/payroll-payments')
export const createPayment = (data) => api.post('/payroll-payments', data)
export const deletePayment = (id) => api.delete(`/payroll-payments/${id}`)
export const getPayrollReport = (start, end, employee_id) => api.get('/payroll/report', { params: { start, end, employee_id } })
export const getPayrollSummary = () => api.get('/payroll/summary')
export const uploadReceiptImage = (receiptId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/inventory-receipts/${receiptId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary')
export const getRevenueChart = () => api.get('/dashboard/revenue-chart')
export const getExpensesChart = () => api.get('/dashboard/expenses-chart')