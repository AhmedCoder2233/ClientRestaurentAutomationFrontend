'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { getDashboardSummary, getRevenueChart, getExpensesChart } from '@/lib/api'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, Receipt, Users, Package, TrendingUp, TrendingDown } from 'lucide-react'

const COLORS = ['#f97316','#ea580c','#c2410c','#9a3412','#7c2d12']
const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

export default function DashboardPage() {
  const { loading } = useAuth()
  const [summary, setSummary] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [expData, setExpData] = useState([])

  useEffect(() => {
    if (loading) return
    getDashboardSummary().then(r => setSummary(r.data)).catch(() => {})
    getRevenueChart().then(r => setRevenueData(r.data)).catch(() => {})
    getExpensesChart().then(r => setExpData(r.data)).catch(() => {})
  }, [loading])

  if (loading) return <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-gray-500 text-sm">Loading…</div>

  const t = summary?.totals || {}
  const m = summary?.monthly || {}
  const profit = t.profit || 0

  const stats = [
    { label: 'Total Revenue',   value: fmt(t.revenue),         icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Expenses',  value: fmt(t.expenses),        icon: Receipt,    color: 'text-red-400',     bg: 'bg-red-500/10' },
    { label: 'Payroll Paid',    value: fmt(t.payroll),         icon: Users,      color: 'text-blue-400',    bg: 'bg-blue-500/10' },
    { label: 'Inventory Value', value: fmt(t.inventory_value), icon: Package,    color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  ]

  return (
    <Sidebar>
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Restaurant performance overview</p>
        </div>

        <div className={`rounded-xl p-4 flex items-center justify-between ${profit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <div>
            <p className="text-xs text-gray-400 mb-1">Overall Profit / Loss</p>
            <p className={`text-3xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(profit)}</p>
          </div>
          {profit >= 0 ? <TrendingUp size={40} className="text-emerald-400 opacity-30" /> : <TrendingDown size={40} className="text-red-400 opacity-30" />}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}><Icon size={15} className={color} /></div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Monthly Revenue',  value: fmt(m.revenue),  color: 'text-emerald-400' },
            { label: 'Monthly Expenses', value: fmt(m.expenses), color: 'text-red-400' },
            { label: 'Monthly Profit',   value: fmt(m.profit),   color: (m.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
              <p className="text-xs text-gray-600 mt-0.5">Last 30 days</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Revenue — Last 30 Days</h2>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ background: '#171717', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }} formatter={v => [`$${v}`, 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="#f97316" fill="url(#g)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-gray-600 text-sm">No revenue data yet</div>
            )}
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Expenses by Type</h2>
            {expData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={expData} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {expData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#171717', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }} formatter={v => [`$${v}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {expData.map((d, i) => (
                    <div key={d.type} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400 truncate flex-1">{d.type}</span>
                      <span className="text-gray-300 font-medium">${d.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-gray-600 text-sm">No expense data yet</div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  )
}