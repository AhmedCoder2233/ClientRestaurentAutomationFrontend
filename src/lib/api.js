import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) config.params = { ...config.params, token }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const login            = (u, p)   => api.post('/auth/login', { username: u, password: p })
export const verifyToken      = (t)      => api.get('/auth/verify', { params: { token: t } })

export const getInventory         = ()      => api.get('/inventory/')
export const createInventoryItem  = (data)  => api.post('/inventory/', data)
export const updateInventoryItem  = (id, d) => api.put(`/inventory/${id}`, d)
export const deleteInventoryItem  = (id)    => api.delete(`/inventory/${id}`)
export const getStockReport       = ()      => api.get('/inventory/report')

export const getSales         = ()      => api.get('/sales/')
export const createSale       = (data)  => api.post('/sales/', data)
export const deleteSale       = (id)    => api.delete(`/sales/${id}`)
export const getDailyRevenue  = ()      => api.get('/sales/revenue/daily')
export const addDailyRevenue  = (data)  => api.post('/sales/revenue/daily', data)
export const deleteRevenue    = (id)    => api.delete(`/sales/revenue/${id}`)
export const getRevenueReport = ()      => api.get('/sales/revenue/report')

export const getExpenses    = ()       => api.get('/expenses/')
export const createExpense  = (data)   => api.post('/expenses/', data)
export const updateExpense  = (id, d)  => api.put(`/expenses/${id}`, d)
export const deleteExpense  = (id)     => api.delete(`/expenses/${id}`)

export const getEmployees      = ()       => api.get('/payroll/employees')
export const createEmployee    = (data)   => api.post('/payroll/employees', data)
export const updateEmployee    = (id, d)  => api.put(`/payroll/employees/${id}`, d)
export const deleteEmployee    = (id)     => api.delete(`/payroll/employees/${id}`)
export const getPayments       = ()       => api.get('/payroll/payments')
export const createPayment     = (data)   => api.post('/payroll/payments', data)
export const deletePayment     = (id)     => api.delete(`/payroll/payments/${id}`)
export const getPayrollSummary = ()       => api.get('/payroll/summary')

export const getDashboardSummary = () => api.get('/dashboard/summary')
export const getRevenueChart     = () => api.get('/dashboard/charts/revenue')
export const getExpensesChart    = () => api.get('/dashboard/charts/expenses')