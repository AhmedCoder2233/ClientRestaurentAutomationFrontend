'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAuth } from '@/lib/useAuth'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const TYPES = ['Rent','Utilities','Ingredients','Equipment','Marketing','Repairs','Other']
const EMPTY = { type: 'Rent', amount: '', date: '', notes: '', custom_type: '' }
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const COLORS = ['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6','#ec4899','#f97316']

export default function ExpensesPage() {
  const { loading } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  const load = () => getExpenses().then(r => setExpenses(r.data)).catch(() => {})
  useEffect(() => { if (!loading) load() }, [loading])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (exp) => {
    const isCustom = !TYPES.slice(0, -1).includes(exp.type)
    setEditing(exp)
    setForm({ type: isCustom ? 'Other' : exp.type, custom_type: isCustom ? exp.type : '', amount: exp.amount, date: exp.date.slice(0, 10), notes: exp.notes || '' })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    const finalType = form.type === 'Other' ? (form.custom_type.trim() || 'Other') : form.type
    const data = { type: finalType, amount: parseFloat(form.amount), date: new Date(form.date).toISOString(), notes: form.notes || null }
    try {
      editing ? await updateExpense(editing.id, data) : await createExpense(data)
      toast.success(editing ? 'Updated' : 'Added')
      setShowModal(false); load()
    } catch { toast.error('Error saving') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return
    await deleteExpense(id); toast.success('Deleted'); load()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byType = {}
  expenses.forEach(e => { byType[e.type] = (byType[e.type] || 0) + e.amount })
  const pieData = Object.entries(byType).map(([type, amount]) => ({ type, amount }))

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading expenses…</p>
      </div>
    </div>
  )

  return (
    <Sidebar>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt size={20} className="text-red-400" />Expenses
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Total: <span className="text-red-400 font-bold">${total.toFixed(2)}</span>
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-xs"><Plus size={13} />Add Expense</button>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="card border border-red-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-400 mt-0.5">${total.toFixed(0)}</p>
          </div>
          <div className="card border border-yellow-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Entries</p>
            <p className="text-2xl font-bold text-yellow-400 mt-0.5">{expenses.length}</p>
          </div>
          <div className="card border border-purple-500/20 relative overflow-hidden sm:col-span-1 col-span-2">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-purple-400 mt-0.5">{pieData.length}</p>
          </div>
        </div>

        {/* Summary cards + pie chart */}
        {pieData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Category Cards */}
            <div className="grid grid-cols-2 gap-3 content-start">
              {Object.entries(byType).map(([type, amt], i) => {
                const pct = total > 0 ? (amt / total) * 100 : 0
                return (
                  <div key={type} className="card border border-neutral-700/50 relative overflow-hidden hover:border-neutral-600 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl opacity-70" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <p className="text-xs text-gray-400 truncate">{type}</p>
                    </div>
                    <p className="text-lg font-bold text-white">${Number(amt).toFixed(0)}</p>
                    <div className="mt-1.5 h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{pct.toFixed(0)}%</p>
                  </div>
                )
              })}
            </div>

            {/* Pie Chart */}
            <div className="card border border-neutral-700/50">
              <h2 className="text-sm font-semibold text-white mb-4">Breakdown</h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={170}>
                  <PieChart>
                    <Pie data={pieData} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={68} innerRadius={38} paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#171717', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }}
                      formatter={v => [`$${Number(v).toFixed(2)}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((d, i) => (
                    <div key={d.type} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400 truncate flex-1">{d.type}</span>
                      <span className="font-semibold" style={{ color: COLORS[i % COLORS.length] }}>${d.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden !p-0 border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="border-b border-neutral-800 bg-neutral-900/80">
                <tr>{['Type', 'Amount', 'Date', 'Notes', ''].map(h => (
                  <th key={h} className="th text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {expenses.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center">
                    <Receipt size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No expenses yet</p>
                  </td></tr>
                )}
                {expenses.map((exp) => {
                  const typeIdx = Object.keys(byType).indexOf(exp.type)
                  const color = COLORS[typeIdx >= 0 ? typeIdx % COLORS.length : 0]
                  return (
                    <tr key={exp.id} className="hover:bg-neutral-800/50 transition-all duration-150 group">
                      <td className="td">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                          >{exp.type}</span>
                        </span>
                      </td>
                      <td className="td text-red-400 font-bold">${exp.amount.toFixed(2)}</td>
                      <td className="td text-gray-400 text-xs">{fmtDate(exp.date)}</td>
                      <td className="td text-gray-500 text-xs">{exp.notes || '—'}</td>
                      <td className="td">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(exp)} className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {form.type === 'Other' && (
              <div>
                <label className="label">Specify Type *</label>
                <input className="input" value={form.custom_type} onChange={e => set('custom_type', e.target.value)} required placeholder="e.g. Insurance, Cleaning..." autoFocus />
              </div>
            )}
            <div><label className="label">Amount ($) *</label><input className="input" type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="0.00" /></div>
            <div><label className="label">Date *</label><input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required /></div>
            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" /></div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Sidebar>
  )
}