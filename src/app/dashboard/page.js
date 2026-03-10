'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { getDashboardSummary, getRevenueChart, getExpensesChart } from '@/lib/api'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts'
import { DollarSign, Receipt, Users, Package, TrendingUp, TrendingDown, Activity } from 'lucide-react'

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316']
const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">${Number(p.value).toLocaleString()}</p>
      ))}
    </div>
  )
}

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

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading dashboard…</p>
      </div>
    </div>
  )

  const t = summary?.totals || {}
  const m = summary?.monthly || {}
  const profit = t.profit || 0

  const stats = [
    { label: 'Total Revenue',   value: fmt(t.revenue),         icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', bar: 'bg-yellow-400' },
    { label: 'Total Expenses',  value: fmt(t.expenses),        icon: Receipt,    color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    bar: 'bg-red-400' },
    { label: 'Payroll Paid',    value: fmt(t.payroll),         icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   bar: 'bg-blue-400' },
    { label: 'Inventory Value', value: fmt(t.inventory_value), icon: Package,    color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', bar: 'bg-purple-400' },
  ]

  // Combined chart data — revenue vs expenses over time
  const combinedData = revenueData.map(r => ({
    date: r.date,
    Revenue: r.amount,
  }))

  return (
    <Sidebar>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-red-400" />
              Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Live restaurant performance</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Today</p>
            <p className="text-sm font-medium text-gray-300">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Profit/Loss Banner */}
        <div className={`relative rounded-2xl p-5 overflow-hidden border ${profit >= 0 ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/25'}`}>
          {/* Background decoration */}
          <div className={`absolute right-0 top-0 w-40 h-full opacity-5 ${profit >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
            style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Overall Profit / Loss</p>
              <p className={`text-4xl font-bold tracking-tight ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(profit)}</p>
              <p className="text-xs text-gray-500 mt-1">{profit >= 0 ? '🟢 Business is profitable' : '🔴 Running at a loss'}</p>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${profit >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
              {profit >= 0
                ? <TrendingUp size={32} className="text-emerald-400" />
                : <TrendingDown size={32} className="text-red-400" />}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color, bg, border, bar }) => (
            <div key={label} className={`card border ${border} relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${bar} opacity-60 rounded-l-xl`} />
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Monthly Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Monthly Revenue',  value: fmt(m.revenue),  color: 'text-yellow-400', bg: 'bg-yellow-400', pct: 100 },
            { label: 'Monthly Expenses', value: fmt(m.expenses), color: 'text-red-400',    bg: 'bg-red-400',    pct: m.revenue ? Math.min(100, (m.expenses / m.revenue) * 100) : 0 },
            { label: 'Monthly Profit',   value: fmt(m.profit),   color: (m.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400', bg: (m.profit || 0) >= 0 ? 'bg-emerald-400' : 'bg-red-400', pct: 60 },
          ].map(({ label, value, color, bg, pct }) => (
            <div key={label} className="card">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
              <div className="mt-2 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full ${bg} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-600 mt-1.5">Last 30 days</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Revenue Area Chart — spans 2 cols */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Revenue — Last 30 Days</h2>
              <span className="text-xs text-gray-500 bg-neutral-800 px-2 py-1 rounded-lg">Daily</span>
            </div>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="yg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="#ef4444" fill="url(#rg)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-600 gap-2">
                <Activity size={28} className="opacity-30" />
                <p className="text-sm">No revenue data yet</p>
              </div>
            )}
          </div>

          {/* Expenses Pie */}
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Expenses Breakdown</h2>
            {expData.length > 0 ? (
              <div className="flex flex-col gap-3">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={expData} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={3}>
                      {expData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs shadow-xl">
                        <p style={{ color: payload[0].payload.fill }}>{payload[0].name}</p>
                        <p className="text-white font-bold">${payload[0].value}</p>
                      </div>
                    ) : null} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {expData.slice(0, 5).map((d, i) => (
                    <div key={d.type} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-gray-400 flex-1 truncate">{d.type}</span>
                      <span className="text-xs text-gray-300 font-medium">${d.amount}</span>
                    </div>
                  ))}
                  {expData.length > 5 && <p className="text-xs text-gray-600 pl-4">+{expData.length - 5} more</p>}
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-gray-600 gap-2">
                <Receipt size={28} className="opacity-30" />
                <p className="text-sm">No expense data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        {revenueData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Bar Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Daily Revenue Bars</h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {revenueData.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? '#ef4444' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white mb-4">Financial Summary</h2>
              <div className="space-y-3">
                {[
                  { label: 'Total Revenue',  value: fmt(t.revenue),  color: '#f59e0b', pct: 100 },
                  { label: 'Total Expenses', value: fmt(t.expenses), color: '#ef4444', pct: t.revenue ? Math.min(100, (t.expenses / t.revenue) * 100) : 0 },
                  { label: 'Payroll',        value: fmt(t.payroll),  color: '#3b82f6', pct: t.revenue ? Math.min(100, (t.payroll  / t.revenue) * 100) : 0 },
                  { label: 'Net Profit',     value: fmt(profit),     color: profit >= 0 ? '#10b981' : '#ef4444', pct: t.revenue ? Math.min(100, Math.max(0, (profit / t.revenue) * 100)) : 0 },
                ].map(({ label, value, color, pct }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs font-semibold" style={{ color }}>{value}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick ratio */}
              <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-2 gap-3">
                <div className="bg-neutral-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Expense Ratio</p>
                  <p className="text-lg font-bold text-red-400">
                    {t.revenue ? Math.round((t.expenses / t.revenue) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-neutral-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Profit Margin</p>
                  <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.revenue ? Math.round((profit / t.revenue) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  )
}