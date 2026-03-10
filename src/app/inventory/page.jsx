'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAuth } from '@/lib/useAuth'
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getInventoryCategories, createInventoryCategory, deleteInventoryCategory, addInventoryReceipt, getInventoryReport, uploadReceiptImage, getInventoryReceipts } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, AlertTriangle, BarChart2, Tag, PackagePlus, ShoppingCart, Upload, Download, ChevronRight, Package } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const UNITS = ['units', 'kg', 'g', 'lbs', 'oz', 'liters', 'ml', 'boxes', 'bags', 'pcs']
const EMPTY = { name: '', unit: 'units', min_quantity: '', category_id: '' }
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const CAT_COLORS = ['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6','#ec4899','#f97316']

export default function InventoryPage() {
  const { loading } = useAuth()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showAddStock, setShowAddStock] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showManageCats, setShowManageCats] = useState(false)
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [detailReceipts, setDetailReceipts] = useState([])
  const [form, setForm] = useState({ ...EMPTY })
  const [stockForm, setStockForm] = useState({ quantity: '', date: '', notes: '' })
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [report, setReport] = useState(null)
  const [reportRange, setReportRange] = useState({ start: '', end: '' })
  const [newCatName, setNewCatName] = useState('')
  const [shoppingList, setShoppingList] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [lightboxImg, setLightboxImg] = useState(null)

  const load = () => {
    getInventory().then(r => setItems(r.data)).catch(() => {})
    getInventoryCategories().then(r => setCategories(r.data)).catch(() => {})
  }
  useEffect(() => { if (!loading) load() }, [loading])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (item) => {
    setEditing(item)
    setForm({ name: item.name, unit: item.unit, min_quantity: item.min_quantity, category_id: item.category_id || '' })
    setShowModal(true)
  }

  const openDetail = async (item) => {
    setDetailItem(item)
    setDetailReceipts([])
    setShowDetail(true)
    try {
      const r = await getInventoryReceipts(item.id)
      setDetailReceipts(r.data)
    } catch { setDetailReceipts([]) }
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    const data = {
      name: form.name, quantity: 0, unit: form.unit,
      purchase_price: 0,
      min_quantity: parseFloat(form.min_quantity) || 0,
      category_id: form.category_id || null
    }
    try {
      editing ? await updateInventoryItem(editing.id, data) : await createInventoryItem(data)
      toast.success(editing ? 'Updated' : 'Item added')
      setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  const handleAddStock = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await addInventoryReceipt({
        inventory_item_id: selectedItem.id,
        quantity: parseFloat(stockForm.quantity),
        date: new Date(stockForm.date).toISOString(),
        notes: stockForm.notes || null,
      })
      if (receiptFile && res.data?.id) {
        try { await uploadReceiptImage(res.data.id, receiptFile) }
        catch { toast('Stock added but image upload failed', { icon: '⚠️' }) }
      }
      toast.success(`Added ${stockForm.quantity} ${selectedItem.unit} to ${selectedItem.name}`)
      setShowAddStock(false)
      setStockForm({ quantity: '', date: '', notes: '' })
      setReceiptFile(null); setReceiptPreview(null)
      load()
    } catch { toast.error('Error') }
    finally { setSaving(false) }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  const handleAddCat = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      await createInventoryCategory({ name: newCatName.trim() })
      toast.success('Category added'); setNewCatName(''); load()
    } catch { toast.error('Error') }
  }

  const runReport = async () => {
    try {
      const r = await getInventoryReport(
        reportRange.start ? new Date(reportRange.start).toISOString() : undefined,
        reportRange.end ? new Date(reportRange.end).toISOString() : undefined
      )
      setReport(r.data)
    } catch { toast.error('Error') }
  }

  const toggleShoppingItem = (item) => {
    setShoppingList(prev => {
      const updated = { ...prev }
      if (updated[item.id]) { delete updated[item.id] } else { updated[item.id] = { ...item, needed: '' } }
      return updated
    })
  }

  const downloadShoppingListPDF = () => {
    const listItems = Object.values(shoppingList)
    const doc = new jsPDF()
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    doc.setFillColor(220, 38, 38)
    doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Shopping List', 14, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${date}`, 14, 22)
    autoTable(doc, {
      startY: 36,
      head: [['Item', 'Need', 'Unit', 'Current Stock']],
      body: listItems.map(i => [i.name, i.needed || '—', i.unit, `${i.quantity} ${i.unit}`]),
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 },
      bodyStyles: { fontSize: 11, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 50, halign: 'center' } },
      margin: { left: 14, right: 14 }
    })
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text(`${listItems.length} items total`, 14, doc.internal.pageSize.height - 10)
    doc.save(`shopping-list-${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.success('PDF downloaded!')
  }

  const filteredItems = filterCat === 'all' ? items : items.filter(i => i.category_id === filterCat)
  const lowCount = items.filter(i => i.min_quantity > 0 && i.quantity <= i.min_quantity).length
  const catColorMap = {}
  categories.forEach((c, i) => { catColorMap[c.id] = CAT_COLORS[i % CAT_COLORS.length] })

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading inventory…</p>
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
              <Package size={20} className="text-red-400" />
              Inventory
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="text-white font-medium">{items.length}</span> items
              {lowCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                  <AlertTriangle size={11} />{lowCount} low stock
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowManageCats(true)} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Tag size={13} />Categories
            </button>
            <button onClick={() => setShowShoppingList(true)} className="btn-secondary flex items-center gap-1.5 text-xs">
              <ShoppingCart size={13} />Shopping List
            </button>
            <button onClick={() => setShowReport(true)} className="btn-yellow flex items-center gap-1.5 text-xs">
              <BarChart2 size={13} />Report
            </button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus size={13} />Add Item
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
          <div className="card border border-yellow-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Total Items</p>
            <p className="text-2xl font-bold text-yellow-400 mt-0.5">{items.length}</p>
          </div>
          <div className="card border border-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{lowCount}</p>
          </div>
          <div className="card border border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-blue-400 mt-0.5">{categories.length}</p>
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                filterCat === 'all'
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20'
                  : 'bg-neutral-800 text-gray-400 hover:text-white border-transparent'
              }`}
            >All</button>
            {categories.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setFilterCat(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border flex items-center gap-1.5 ${
                  filterCat === c.id
                    ? 'text-white border-transparent shadow-md'
                    : 'bg-neutral-800 text-gray-400 hover:text-white border-transparent'
                }`}
                style={filterCat === c.id ? { background: CAT_COLORS[i % CAT_COLORS.length], boxShadow: `0 4px 12px ${CAT_COLORS[i % CAT_COLORS.length]}30` } : {}}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden !p-0 border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="border-b border-neutral-800 bg-neutral-900/80">
                <tr>
                  {['Name', 'Category', 'Stock', 'Unit', 'Min Stock', 'Status', ''].map(h => (
                    <th key={h} className="th text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Package size={32} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No items yet</p>
                    </td>
                  </tr>
                )}
                {filteredItems.map(item => {
                  const low = item.min_quantity > 0 && item.quantity <= item.min_quantity
                  const cat = categories.find(c => c.id === item.category_id)
                  const catColor = cat ? catColorMap[cat.id] : null
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-800/50 transition-all duration-150 cursor-pointer group"
                      onClick={() => openDetail(item)}
                    >
                      <td className="td font-medium text-white">
                        <span className="flex items-center gap-1.5">
                          {low && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                          {item.name}
                          <ChevronRight size={12} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </span>
                      </td>
                      <td className="td">
                        {cat ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>
                            {cat.name}
                          </span>
                        ) : <span className="text-gray-600 text-xs">—</span>}
                      </td>
                      <td className="td">
                        <span className={`font-bold text-sm ${low ? 'text-amber-400' : 'text-white'}`}>{item.quantity}</span>
                      </td>
                      <td className="td text-gray-400 text-xs">{item.unit}</td>
                      <td className="td text-gray-500 text-xs">{item.min_quantity || '—'}</td>
                      <td className="td">
                        {low ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-xs font-medium border border-amber-400/20">
                            <AlertTriangle size={10} />Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-medium border border-emerald-400/20">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="td" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedItem(item); setStockForm({ quantity: '', date: new Date().toISOString().slice(0, 10), notes: '' }); setReceiptFile(null); setReceiptPreview(null); setShowAddStock(true) }}
                            className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all" title="Add stock"
                          ><PackagePlus size={13} /></button>
                          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"><Pencil size={13} /></button>
                          <button onClick={async () => { if (!confirm('Delete?')) return; await deleteInventoryItem(item.id); toast.success('Deleted'); load() }} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={13} /></button>
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

      {/* Item Detail Modal */}
      {showDetail && detailItem && (
        <Modal title={detailItem.name} onClose={() => setShowDetail(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Current Stock', value: detailItem.quantity, sub: detailItem.unit, color: 'text-yellow-400', border: 'border-yellow-500/20' },
                { label: 'Min Alert', value: detailItem.min_quantity || '—', sub: detailItem.unit, color: 'text-amber-400', border: 'border-amber-500/20' },
                { label: 'Receipts', value: detailReceipts.length, sub: 'total', color: 'text-blue-400', border: 'border-blue-500/20' },
              ].map(({ label, value, sub, color, border }) => (
                <div key={label} className={`bg-neutral-800/60 rounded-xl p-3 text-center border ${border}`}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Stock Receipt History</h3>
              {detailReceipts.length === 0 && (
                <div className="text-center py-8">
                  <PackagePlus size={28} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No receipts yet.</p>
                </div>
              )}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {detailReceipts.map((r, i) => (
                  <div key={i} className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-3 space-y-2 hover:border-neutral-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                          <span className="text-emerald-400">+</span>{r.quantity} {detailItem.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      {r.notes && <span className="text-xs text-gray-500 italic bg-neutral-700/50 px-2 py-1 rounded-lg max-w-[120px] text-right">{r.notes}</span>}
                    </div>
                    {r.receipt_image_url ? (
                      <div
                        className="cursor-pointer rounded-xl overflow-hidden border border-neutral-700 hover:border-yellow-500/50 transition-all group/img"
                        onClick={() => setLightboxImg(`${API_URL}${r.receipt_image_url}`)}
                      >
                        <img
                          src={`${API_URL}${r.receipt_image_url}`}
                          alt="Receipt"
                          className="w-full max-h-36 object-cover group-hover/img:scale-[1.02] transition-transform duration-300"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                        />
                        <div className="hidden items-center justify-center py-4 text-xs text-gray-500">Could not load image</div>
                        <p className="text-xs text-center text-gray-500 py-1.5 bg-neutral-900/70 group-hover/img:text-yellow-400 transition-colors">
                          Tap to enlarge
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-700 italic flex items-center gap-1"><Upload size={10} />No receipt image attached</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setShowDetail(false); setSelectedItem(detailItem); setStockForm({ quantity: '', date: new Date().toISOString().slice(0, 10), notes: '' }); setReceiptFile(null); setReceiptPreview(null); setShowAddStock(true) }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            ><PackagePlus size={14} />Add Stock</button>
          </div>
        </Modal>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white bg-neutral-800 hover:bg-neutral-700 rounded-full w-9 h-9 flex items-center justify-center text-sm transition-colors z-10" onClick={() => setLightboxImg(null)}>✕</button>
          <img src={lightboxImg} alt="Receipt full" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Item' : 'Add Inventory Item'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label">Item Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Tomatoes, Chicken" autoFocus />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Unit</label>
                <select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Min Stock Alert</label>
                <input className="input" type="number" step="0.01" value={form.min_quantity} onChange={e => set('min_quantity', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Stock Modal */}
      {showAddStock && selectedItem && (
        <Modal title={`Add Stock — ${selectedItem.name}`} onClose={() => { setShowAddStock(false); setReceiptFile(null); setReceiptPreview(null) }}>
          <form onSubmit={handleAddStock} className="space-y-3">
            <div className="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400">Current stock</p>
              <p className="text-xl font-bold text-yellow-400">{selectedItem.quantity} <span className="text-sm font-normal text-gray-400">{selectedItem.unit}</span></p>
            </div>
            <div>
              <label className="label">Quantity Received *</label>
              <input className="input" type="number" step="0.01" value={stockForm.quantity} onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))} required placeholder="0" autoFocus />
            </div>
            <div>
              <label className="label">Date Received *</label>
              <input className="input" type="date" value={stockForm.date} onChange={e => setStockForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={stockForm.notes} onChange={e => setStockForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Receipt Picture <span className="text-gray-600">(optional)</span></label>
              <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${receiptPreview ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-neutral-700 hover:border-red-500/40 hover:bg-red-500/5 bg-neutral-800/50'}`}>
                {receiptPreview ? (
                  <div className="relative w-full">
                    <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-40 object-contain rounded-xl p-2" />
                    <button type="button" onClick={(e) => { e.preventDefault(); setReceiptFile(null); setReceiptPreview(null) }} className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors shadow-lg">✕</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-5 gap-2">
                    <div className="w-10 h-10 rounded-xl bg-neutral-700 flex items-center justify-center mb-1">
                      <Upload size={18} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-400">Click to upload receipt photo</span>
                    <span className="text-xs text-gray-600">JPG, PNG, WEBP supported</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setShowAddStock(false); setReceiptFile(null); setReceiptPreview(null) }} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Add Stock'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Categories */}
      {showManageCats && (
        <Modal title="Inventory Categories" onClose={() => setShowManageCats(false)}>
          <div className="space-y-4">
            <form onSubmit={handleAddCat} className="flex gap-2">
              <input className="input flex-1" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name..." autoFocus />
              <button type="submit" className="btn-primary px-4 flex items-center gap-1"><Plus size={15} /></button>
            </form>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.length === 0 && (
                <div className="text-center py-8">
                  <Tag size={28} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No categories yet</p>
                </div>
              )}
              {categories.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between bg-neutral-800/60 border border-neutral-700/50 rounded-xl px-3 py-2.5 hover:border-neutral-600 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span className="text-sm text-white">{c.name}</span>
                  </div>
                  <button onClick={async () => { try { await deleteInventoryCategory(c.id); toast.success('Deleted'); load() } catch { toast.error('Error') } }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Shopping List */}
      {showShoppingList && (
        <Modal title="Shopping List" onClose={() => setShowShoppingList(false)}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Select items and enter how much you need</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart size={28} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No items in inventory</p>
                </div>
              )}
              {items.map(item => {
                const selected = !!shoppingList[item.id]
                const low = item.min_quantity > 0 && item.quantity <= item.min_quantity
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150 border ${
                      selected
                        ? 'bg-red-600/12 border-red-600/35 shadow-sm'
                        : 'bg-neutral-800/60 border-neutral-700/50 hover:border-neutral-600'
                    }`}
                    onClick={() => toggleShoppingItem(item)}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selected ? 'bg-red-600 border-red-600' : 'border-neutral-600'}`}>
                      {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm text-white flex-1">{item.name}</span>
                    {low && (
                      <span className="text-xs text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle size={10} />Low
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
                    {selected && (
                      <input
                        className="input w-20 text-xs py-1 px-2"
                        type="number" step="0.01" placeholder="Need"
                        value={shoppingList[item.id]?.needed || ''}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setShoppingList(prev => ({ ...prev, [item.id]: { ...prev[item.id], needed: e.target.value } }))}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {Object.keys(shoppingList).length > 0 && (
              <button onClick={downloadShoppingListPDF} className="btn-yellow w-full flex items-center justify-center gap-2">
                <Download size={14} />Download PDF ({Object.keys(shoppingList).length} items)
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Inventory Report */}
      {showReport && (
        <Modal title="Inventory Report" onClose={() => setShowReport(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">From</label><input className="input" type="date" value={reportRange.start} onChange={e => setReportRange(r => ({ ...r, start: e.target.value }))} /></div>
              <div><label className="label">To</label><input className="input" type="date" value={reportRange.end} onChange={e => setReportRange(r => ({ ...r, end: e.target.value }))} /></div>
            </div>
            <button onClick={runReport} className="btn-yellow w-full">Run Report</button>
            {report && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {report.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No data for selected range</p>}
                {report.map(item => (
                  <div key={item.id} className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-3 hover:border-neutral-600 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{item.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'Low'
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                      }`}>{item.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-neutral-700/40 rounded-lg px-2 py-1.5">
                        <p className="text-gray-500 mb-0.5">Current</p>
                        <p className="text-white font-semibold">{item.current_qty} {item.unit}</p>
                      </div>
                      <div className="bg-neutral-700/40 rounded-lg px-2 py-1.5">
                        <p className="text-gray-500 mb-0.5">Total Received</p>
                        <p className="text-emerald-400 font-semibold">+{item.total_received} {item.unit}</p>
                      </div>
                    </div>
                    {item.receipts?.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-neutral-700/50 pt-2">
                        {item.receipts.map((r, i) => (
                          <div key={i} className="text-xs flex justify-between items-center">
                            <span className="text-gray-500">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="text-emerald-400 font-medium">+{r.quantity} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </Sidebar>
  )
}