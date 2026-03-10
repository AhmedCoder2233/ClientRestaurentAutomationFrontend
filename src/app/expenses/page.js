'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAuth } from '@/lib/useAuth'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const TYPES = ['Rent','Utilities','Ingredients','Equipment','Marketing','Repairs','Other']
const EMPTY = { type:'Rent', amount:'', date:'', notes:'', custom_type:'' }
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })

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
    // Agar type predefined list mein nahi hai to "Other" select karo aur custom_type mein daalo
    const isCustom = !TYPES.slice(0, -1).includes(exp.type) // "Other" ke alawa check
    setEditing(exp)
    setForm({
      type: isCustom ? 'Other' : exp.type,
      custom_type: isCustom ? exp.type : '',
      amount: exp.amount,
      date: exp.date.slice(0, 10),
      notes: exp.notes || ''
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    // Agar Other select hai to custom_type use karo
    const finalType = form.type === 'Other'
      ? (form.custom_type.trim() || 'Other')
      : form.type
    const data = {
      type: finalType,
      amount: parseFloat(form.amount),
      date: new Date(form.date).toISOString(),
      notes: form.notes || null
    }
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

  if (loading) return null

  return (
    <Sidebar>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Expenses</h1>
            <p className="text-sm text-gray-400 mt-0.5">Total: <span className="text-red-400 font-medium">${total.toFixed(2)}</span></p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={14} />Add Expense</button>
        </div>

        {Object.keys(byType).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(byType).map(([type, amt]) => (
              <div key={type} className="card">
                <p className="text-xs text-gray-400">{type}</p>
                <p className="text-lg font-bold text-white mt-0.5">${Number(amt).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="border-b border-neutral-800"><tr>{['Type','Amount','Date','Notes',''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-neutral-800">
                {expenses.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-10 text-sm">No expenses yet</td></tr>}
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="td"><span className="px-2 py-0.5 bg-neutral-700 rounded text-xs font-medium text-gray-300">{exp.type}</span></td>
                    <td className="td text-red-400 font-medium">${exp.amount.toFixed(2)}</td>
                    <td className="td text-gray-400">{fmtDate(exp.date)}</td>
                    <td className="td text-gray-500">{exp.notes || '—'}</td>
                    <td className="td">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(exp)} className="p-1.5 text-gray-400 hover:text-orange-400 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Other select hone par custom input show karo */}
            {form.type === 'Other' && (
              <div>
                <label className="label">Specify Type *</label>
                <input
                  className="input"
                  value={form.custom_type}
                  onChange={e => set('custom_type', e.target.value)}
                  required
                  placeholder="e.g. Insurance, Cleaning, Delivery..."
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="label">Amount ($) *</label>
              <input className="input" type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="0.00" />
            </div>
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
            </div>
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