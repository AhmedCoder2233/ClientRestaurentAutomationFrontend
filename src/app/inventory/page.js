'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAuth } from '@/lib/useAuth'
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getStockReport } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, AlertTriangle, BarChart3 } from 'lucide-react'

const UNITS = ['units','kg','g','lbs','oz','liters','ml','boxes','bags','pcs']
const EMPTY = { name:'', quantity:'', unit:'units', purchase_price:'', min_quantity:'' }

export default function InventoryPage() {
  const { loading } = useAuth()
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [report, setReport] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => getInventory().then(r => setItems(r.data)).catch(() => {})
  useEffect(() => { if (!loading) load() }, [loading])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ name: item.name, quantity: item.quantity, unit: item.unit, purchase_price: item.purchase_price, min_quantity: item.min_quantity })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    const data = { name: form.name, quantity: parseFloat(form.quantity), unit: form.unit, purchase_price: parseFloat(form.purchase_price), min_quantity: parseFloat(form.min_quantity) || 0 }
    try {
      editing ? await updateInventoryItem(editing.id, data) : await createInventoryItem(data)
      toast.success(editing ? 'Item updated' : 'Item added')
      setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error saving') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await deleteInventoryItem(id); toast.success('Deleted'); load()
  }

  const loadReport = async () => {
    const r = await getStockReport(); setReport(r.data); setShowReport(true)
  }

  const totalCost = items.reduce((s, i) => s + i.quantity * i.purchase_price, 0)
  if (loading) return null

  return (
    <Sidebar>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Inventory</h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} items · Value: <span className="text-orange-400 font-medium">${totalCost.toFixed(2)}</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadReport} className="btn-secondary flex items-center gap-2"><BarChart3 size={14} /> Stock Report</button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={14} /> Add Item</button>
          </div>
        </div>

        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-neutral-800">
                <tr>{['Name','Qty','Unit','Price','Total Cost','Min Stock','Status',''].map(h => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {items.length === 0 && <tr><td colSpan={8} className="text-center text-gray-500 py-10 text-sm">No items yet</td></tr>}
                {items.map(item => {
                  const low = item.min_quantity > 0 && item.quantity <= item.min_quantity
                  return (
                    <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="td font-medium text-white">{item.name}</td>
                      <td className="td">{item.quantity}</td>
                      <td className="td text-gray-400">{item.unit}</td>
                      <td className="td">${item.purchase_price.toFixed(2)}</td>
                      <td className="td">${(item.quantity * item.purchase_price).toFixed(2)}</td>
                      <td className="td">{item.min_quantity}</td>
                      <td className="td">
                        {low ? <span className="flex items-center gap-1 text-amber-400 text-xs font-medium"><AlertTriangle size={11} />Low</span>
                              : <span className="text-emerald-400 text-xs font-medium">OK</span>}
                      </td>
                      <td className="td">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-orange-400 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
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

      {showModal && (
        <Modal title={editing ? 'Edit Item' : 'Add Inventory Item'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Tomatoes" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Quantity *</label><input className="input" type="number" step="0.01" value={form.quantity} onChange={e => set('quantity', e.target.value)} required placeholder="0" /></div>
              <div><label className="label">Unit</label><select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Purchase Price ($) *</label><input className="input" type="number" step="0.01" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} required placeholder="0.00" /></div>
              <div><label className="label">Min Stock Alert</label><input className="input" type="number" step="0.01" value={form.min_quantity} onChange={e => set('min_quantity', e.target.value)} placeholder="0" /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showReport && report && (
        <Modal title="Stock Report" onClose={() => setShowReport(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-800 rounded-lg p-3 text-center"><p className="text-xs text-gray-400">Total Items</p><p className="text-2xl font-bold text-white">{report.total_items}</p></div>
              <div className="bg-neutral-800 rounded-lg p-3 text-center"><p className="text-xs text-gray-400">Inventory Value</p><p className="text-2xl font-bold text-orange-400">${report.total_inventory_cost}</p></div>
            </div>
            {report.low_stock_items.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-amber-400 flex items-center gap-1.5 mb-2"><AlertTriangle size={13} />Needs Restocking ({report.low_stock_items.length})</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {report.low_stock_items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <span className="text-sm text-white">{item.name}</span>
                      <span className="text-xs text-amber-400">{item.quantity} {item.unit} (min: {item.min_quantity})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-emerald-400 text-center py-2">✓ All items sufficiently stocked</p>}
          </div>
        </Modal>
      )}
    </Sidebar>
  )
}