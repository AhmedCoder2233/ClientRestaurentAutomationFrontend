'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAuth } from '@/lib/useAuth'
import { getSales, createSale, deleteSale, getDailyRevenue, addDailyRevenue, deleteRevenue, getRevenueReport, getInventory } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, DollarSign } from 'lucide-react'

const SALE_EMPTY = { product_name:'', quantity:'', selling_price:'', date:'', notes:'' }
const REV_EMPTY  = { date:'', amount:'', notes:'' }
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })

export default function SalesPage() {
  const { loading } = useAuth()
  const [sales, setSales] = useState([])
  const [revenues, setRevenues] = useState([])
  const [report, setReport] = useState(null)
  const [inventory, setInventory] = useState([])
  const [tab, setTab] = useState('sales')
  const [showSale, setShowSale] = useState(false)
  const [showRev, setShowRev] = useState(false)
  const [saleForm, setSaleForm] = useState({ ...SALE_EMPTY })
  const [revForm, setRevForm] = useState({ ...REV_EMPTY })
  const [saving, setSaving] = useState(false)

  const load = () => {
    getSales().then(r => setSales(r.data)).catch(() => {})
    getDailyRevenue().then(r => setRevenues(r.data)).catch(() => {})
    getRevenueReport().then(r => setReport(r.data)).catch(() => {})
    getInventory().then(r => setInventory(r.data)).catch(() => {})
  }
  useEffect(() => { if (!loading) load() }, [loading])

  const setSale = (k, v) => setSaleForm(f => ({ ...f, [k]: v }))
  const setRev  = (k, v) => setRevForm(f => ({ ...f, [k]: v }))

  const handleSale = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const matchedItem = inventory.find(
        i => i.name.toLowerCase() === saleForm.product_name.toLowerCase()
      )
      if (matchedItem) {
        if (matchedItem.quantity < parseFloat(saleForm.quantity)) {
          toast.error(`Insufficient stock! Available: ${matchedItem.quantity} ${matchedItem.unit}`)
          setSaving(false)
          return
        }
      }
      await createSale({
        product_name: saleForm.product_name,
        inventory_item_id: matchedItem ? matchedItem.id : null,
        quantity: parseFloat(saleForm.quantity),
        total_price: parseFloat(saleForm.selling_price),
        date: saleForm.date ? new Date(saleForm.date).toISOString() : undefined,
        notes: saleForm.notes || null,
      })
      if (matchedItem) {
        toast.success(`Sale recorded — inventory "${matchedItem.name}" updated`)
      } else {
        toast.success('Sale recorded')
      }
      setShowSale(false); load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error recording sale')
    } finally { setSaving(false) }
  }

  const handleRevenue = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await addDailyRevenue({ date: new Date(revForm.date).toISOString(), amount: parseFloat(revForm.amount), notes: revForm.notes || null })
      toast.success('Revenue logged'); setShowRev(false); load()
    } catch { toast.error('Error') } finally { setSaving(false) }
  }

  if (loading) return null

  return (
    <Sidebar>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Sales</h1>
            <p className="text-sm text-gray-400 mt-0.5">Record orders and track revenue</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setSaleForm({ ...SALE_EMPTY }); setShowSale(true) }} className="btn-primary flex items-center gap-2"><Plus size={14} />New Sale</button>
            <button onClick={() => { setRevForm({ ...REV_EMPTY }); setShowRev(true) }} className="btn-secondary flex items-center gap-2"><DollarSign size={14} />Log Revenue</button>
          </div>
        </div>

        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{ label:'Weekly', value:report.weekly },{ label:'Bi-Weekly', value:report.biweekly },{ label:'Monthly', value:report.monthly },{ label:'All Time', value:report.all_time }].map(({ label, value }) => (
              <div key={label} className="card text-center">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-lg font-bold text-orange-400 mt-0.5">${Number(value).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-5 border-b border-neutral-800">
          {[{ key:'sales', label:`Sales (${sales.length})` },{ key:'revenue', label:`Daily Revenue (${revenues.length})` }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>{label}</button>
          ))}
        </div>

        {tab === 'sales' && (
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="border-b border-neutral-800">
                  <tr>{['Product','Qty','Sales Revenue','Date','Notes',''].map(h => <th key={h} className="th">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {sales.length === 0 && <tr><td colSpan={6} className="text-center text-gray-500 py-10 text-sm">No sales yet</td></tr>}
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="td font-medium text-white">{s.product_name}</td>
                      <td className="td">{s.quantity}</td>
                      <td className="td text-emerald-400 font-medium">${s.total_price.toFixed(2)}</td>
                      <td className="td text-gray-400">{fmtDate(s.date)}</td>
                      <td className="td text-gray-500">{s.notes || '—'}</td>
                      <td className="td">
                        <button onClick={async () => { if(!confirm('Delete?'))return; await deleteSale(s.id); toast.success('Deleted'); load() }} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'revenue' && (
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="border-b border-neutral-800"><tr>{['Date','Amount','Notes',''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-neutral-800">
                  {revenues.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-10 text-sm">No revenue entries yet</td></tr>}
                  {revenues.map(r => (
                    <tr key={r.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="td text-white">{fmtDate(r.date)}</td>
                      <td className="td text-emerald-400 font-medium">${Number(r.amount).toLocaleString()}</td>
                      <td className="td text-gray-500">{r.notes || '—'}</td>
                      <td className="td">
                        <button onClick={async () => { if(!confirm('Delete?'))return; await deleteRevenue(r.id); toast.success('Deleted'); load() }} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showSale && (
        <Modal title="Record Sale" onClose={() => setShowSale(false)}>
          <form onSubmit={handleSale} className="space-y-3">
            <div>
              <label className="label">Product Name *</label>
              <input
                className="input"
                list="inventory-suggestions"
                value={saleForm.product_name}
                onChange={e => setSale('product_name', e.target.value)}
                required
                placeholder="e.g. Tomatoes"
              />
              <datalist id="inventory-suggestions">
                {inventory.map(i => (
                  <option key={i.id} value={i.name} />
                ))}
              </datalist>
              {saleForm.product_name && (() => {
                const match = inventory.find(i => i.name.toLowerCase() === saleForm.product_name.toLowerCase())
                return match ? (
                  <p className="text-xs text-emerald-400 mt-1">✓ Inventory match — stock: {match.quantity} {match.unit}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">No inventory match — recorded without stock deduction</p>
                )
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Quantity *</label>
                <input className="input" type="number" step="0.01" value={saleForm.quantity} onChange={e => setSale('quantity', e.target.value)} required placeholder="1" />
              </div>
              <div>
                <label className="label">Sales Revenue ($) *</label>
                <input className="input" type="number" step="0.01" value={saleForm.selling_price} onChange={e => setSale('selling_price', e.target.value)} required placeholder="How much earned?" />
              </div>
            </div>

            <div>
              <label className="label">Date & Time</label>
              <input className="input" type="datetime-local" value={saleForm.date} onChange={e => setSale('date', e.target.value)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={saleForm.notes} onChange={e => setSale('notes', e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowSale(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Record Sale'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showRev && (
        <Modal title="Log Daily Revenue" onClose={() => setShowRev(false)}>
          <form onSubmit={handleRevenue} className="space-y-3">
            <div><label className="label">Date *</label><input className="input" type="date" value={revForm.date} onChange={e => setRev('date', e.target.value)} required /></div>
            <div><label className="label">Amount ($) *</label><input className="input" type="number" step="0.01" value={revForm.amount} onChange={e => setRev('amount', e.target.value)} required placeholder="0.00" /></div>
            <div><label className="label">Notes</label><input className="input" value={revForm.notes} onChange={e => setRev('notes', e.target.value)} placeholder="e.g. Busy Friday night" /></div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowRev(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Log Revenue'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Sidebar>
  )
}