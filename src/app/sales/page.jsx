'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAuth } from '@/lib/useAuth'
import { getSales, createSale, deleteSale, getSaleCategories, createSaleCategory, deleteSaleCategory, getSalesReport } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, BarChart2, Tag, ShoppingCart, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

const SALE_EMPTY = { category_id: '', amount: '', date: '', notes: '' }
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const CAT_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']

export default function SalesPage() {
  const { loading } = useAuth()
  const [sales, setSales] = useState([])
  const [categories, setCategories] = useState([])
  const [showSale, setShowSale] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showManageCats, setShowManageCats] = useState(false)
  const [saleForm, setSaleForm] = useState({ ...SALE_EMPTY })
  const [newCatName, setNewCatName] = useState('')
  const [reportRange, setReportRange] = useState({ start: '', end: '' })
  const [report, setReport] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    getSales().then(r => setSales(r.data)).catch(() => {})
    getSaleCategories().then(r => setCategories(r.data)).catch(() => {})
  }
  useEffect(() => { if (!loading) load() }, [loading])

  const handleSale = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const cat = categories.find(c => c.id === saleForm.category_id)
      await createSale({
        category_id: saleForm.category_id || null,
        category_name: cat?.name || null,
        total_price: parseFloat(saleForm.amount),
        date: saleForm.date ? new Date(saleForm.date).toISOString() : undefined,
        notes: saleForm.notes || null,
      })
      toast.success('Sale recorded')
      setShowSale(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      await createSaleCategory({ name: newCatName.trim() })
      toast.success('Category added'); setNewCatName(''); load()
    } catch { toast.error('Error') }
  }

  const handleDeleteCat = async (id) => {
    if (!confirm('Delete this category?')) return
    try { await deleteSaleCategory(id); toast.success('Deleted'); load() }
    catch { toast.error('Error') }
  }

  const runReport = async () => {
    try {
      const r = await getSalesReport(
        reportRange.start ? new Date(reportRange.start).toISOString() : undefined,
        reportRange.end ? new Date(reportRange.end).toISOString() : undefined
      )
      setReport(r.data)
    } catch { toast.error('Error running report') }
  }

  const totalAll = sales.reduce((s, x) => s + x.total_price, 0)

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading sales…</p>
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
              <ShoppingCart size={20} className="text-red-400" />Sales
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Total: <span className="text-yellow-400 font-bold">${totalAll.toLocaleString()}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowManageCats(true)} className="btn-secondary flex items-center gap-1.5 text-xs"><Tag size={13} />Categories</button>
            <button onClick={() => setShowReport(true)} className="btn-yellow flex items-center gap-1.5 text-xs"><BarChart2 size={13} />Report</button>
            <button onClick={() => { setSaleForm({ ...SALE_EMPTY }); setShowSale(true) }} className="btn-primary flex items-center gap-1.5 text-xs"><Plus size={13} />New Sale</button>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="card border border-yellow-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-yellow-400 mt-0.5">${totalAll.toLocaleString()}</p>
          </div>
          <div className="card border border-red-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="text-2xl font-bold text-white mt-0.5">{sales.length}</p>
          </div>
          <div className="card border border-blue-500/20 relative overflow-hidden sm:col-span-1 col-span-2">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-blue-400 mt-0.5">{categories.length}</p>
          </div>
        </div>

        {/* Category summary cards */}
        {categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat, i) => {
              const total = sales.filter(s => s.category_name === cat.name).reduce((sum, s) => sum + s.total_price, 0)
              const pct = totalAll > 0 ? (total / totalAll) * 100 : 0
              return (
                <div key={cat.id} className="card border border-neutral-700/50 relative overflow-hidden hover:border-neutral-600 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl opacity-70" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <p className="text-xs text-gray-400 truncate">{cat.name}</p>
                  </div>
                  <p className="text-lg font-bold text-white">${total.toLocaleString()}</p>
                  <div className="mt-2 h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{pct.toFixed(0)}% of total</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Sales table */}
        <div className="card overflow-hidden !p-0 border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="border-b border-neutral-800 bg-neutral-900/80">
                <tr>{['Category', 'Amount', 'Date', 'Notes', ''].map(h => (
                  <th key={h} className="th text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {sales.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center">
                    <ShoppingCart size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No sales yet</p>
                  </td></tr>
                )}
                {sales.map((s) => {
                  const catIdx = categories.findIndex(c => c.name === s.category_name)
                  const color = CAT_COLORS[catIdx >= 0 ? catIdx % CAT_COLORS.length : 0]
                  return (
                    <tr key={s.id} className="hover:bg-neutral-800/50 transition-all duration-150 group">
                      <td className="td">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                          >{s.category_name || 'Uncategorized'}</span>
                        </span>
                      </td>
                      <td className="td text-yellow-400 font-bold">${s.total_price.toFixed(2)}</td>
                      <td className="td text-gray-400 text-xs">{fmtDate(s.date)}</td>
                      <td className="td text-gray-500 text-xs">{s.notes || '—'}</td>
                      <td className="td">
                        <button
                          onClick={async () => { if (!confirm('Delete?')) return; await deleteSale(s.id); toast.success('Deleted'); load() }}
                          className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        ><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Sale Modal */}
      {showSale && (
        <Modal title="Record Sale" onClose={() => setShowSale(false)}>
          <form onSubmit={handleSale} className="space-y-3">
            <div>
              <label className="label">Category *</label>
              <select className="input" value={saleForm.category_id} onChange={e => setSaleForm(f => ({ ...f, category_id: e.target.value }))} required>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount ($) *</label>
              <input className="input" type="number" step="0.01" value={saleForm.amount} onChange={e => setSaleForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00" autoFocus />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={saleForm.date} onChange={e => setSaleForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={saleForm.notes} onChange={e => setSaleForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowSale(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Record Sale'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Categories Modal */}
      {showManageCats && (
        <Modal title="Manage Categories" onClose={() => setShowManageCats(false)}>
          <div className="space-y-4">
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input className="input flex-1" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name..." autoFocus />
              <button type="submit" className="btn-primary px-3"><Plus size={16} /></button>
            </form>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.length === 0 && (
                <div className="text-center py-8">
                  <Tag size={28} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No categories yet</p>
                </div>
              )}
              {categories.map((cat, i) => (
                <div key={cat.id} className="flex items-center justify-between bg-neutral-800/60 border border-neutral-700/50 rounded-xl px-3 py-2.5 hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span className="text-sm text-white">{cat.name}</span>
                  </div>
                  <button onClick={() => handleDeleteCat(cat.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Report Modal */}
      {showReport && (
        <Modal title="Sales Report" onClose={() => setShowReport(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">From</label><input className="input" type="date" value={reportRange.start} onChange={e => setReportRange(r => ({ ...r, start: e.target.value }))} /></div>
              <div><label className="label">To</label><input className="input" type="date" value={reportRange.end} onChange={e => setReportRange(r => ({ ...r, end: e.target.value }))} /></div>
            </div>
            <button onClick={runReport} className="btn-yellow w-full">Run Report</button>

            {report && (
              <div className="space-y-4 pt-1">
                <div className="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-yellow-400">${Number(report.total).toLocaleString()}</p>
                </div>

                {Object.keys(report.by_category).length > 0 && (
                  <>
                    <div className="space-y-2">
                      {Object.entries(report.by_category).map(([cat, amt], i) => {
                        const pct = report.total > 0 ? (amt / report.total) * 100 : 0
                        return (
                          <div key={cat} className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl px-3 py-2.5 hover:border-neutral-600 transition-colors">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                                <span className="text-sm text-white">{cat}</span>
                              </div>
                              <span className="text-sm font-bold text-yellow-400">${Number(amt).toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{pct.toFixed(0)}% of total</p>
                          </div>
                        )
                      })}
                    </div>

                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={Object.entries(report.by_category).map(([cat, amt], i) => ({ cat, amt, fill: CAT_COLORS[i % CAT_COLORS.length] }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis dataKey="cat" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip contentStyle={{ background: '#171717', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }} formatter={v => [`$${v}`, 'Revenue']} />
                        <Bar dataKey="amt" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {Object.entries(report.by_category).map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </Sidebar>
  )
}