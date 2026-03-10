'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAuth } from '@/lib/useAuth'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getPayments, createPayment, deletePayment, getPayrollSummary, getPayrollReport } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, BarChart2, Users, DollarSign, CartesianGrid } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const EMP_EMPTY = { name: '', role: '' }
const PAY_EMPTY = { employee_id: '', amount: '', payment_date: '', payment_method: 'Cash', hours_worked: '', notes: '' }
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const EMP_COLORS = ['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6','#ec4899','#f97316']

export default function PayrollPage() {
  const { loading } = useAuth()
  const [employees, setEmployees] = useState([])
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [tab, setTab] = useState('employees')
  const [showEmp, setShowEmp] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [editingEmp, setEditingEmp] = useState(null)
  const [empForm, setEmpForm] = useState({ ...EMP_EMPTY })
  const [payForm, setPayForm] = useState({ ...PAY_EMPTY })
  const [report, setReport] = useState(null)
  const [reportRange, setReportRange] = useState({ start: '', end: '', employee_id: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    getEmployees().then(r => setEmployees(r.data)).catch(() => {})
    getPayments().then(r => setPayments(r.data)).catch(() => {})
    getPayrollSummary().then(r => setSummary(r.data)).catch(() => {})
  }
  useEffect(() => { if (!loading) load() }, [loading])

  const handleSaveEmp = async (e) => {
    e.preventDefault(); setSaving(true)
    const data = { name: empForm.name, role: empForm.role || null }
    try {
      editingEmp ? await updateEmployee(editingEmp.id, data) : await createEmployee(data)
      toast.success(editingEmp ? 'Updated' : 'Employee added')
      setShowEmp(false); load()
    } catch { toast.error('Error') } finally { setSaving(false) }
  }

  const handlePayment = async (e) => {
    e.preventDefault(); setSaving(true)
    const emp = employees.find(em => em.id === payForm.employee_id)
    try {
      await createPayment({
        employee_id: payForm.employee_id,
        employee_name: emp?.name || '',
        amount: parseFloat(payForm.amount),
        payment_date: new Date(payForm.payment_date).toISOString(),
        payment_method: payForm.payment_method,
        hours_worked: payForm.hours_worked || null,
        notes: payForm.notes || null,
      })
      toast.success('Payment recorded'); setShowPay(false); load()
    } catch { toast.error('Error') } finally { setSaving(false) }
  }

  const runReport = async () => {
    try {
      const r = await getPayrollReport(
        reportRange.start ? new Date(reportRange.start).toISOString() : undefined,
        reportRange.end ? new Date(reportRange.end).toISOString() : undefined,
        reportRange.employee_id || undefined
      )
      setReport(r.data)
    } catch { toast.error('Error') }
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading payroll…</p>
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
              <Users size={20} className="text-red-400" />Payroll
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Employees and payments</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowReport(true)} className="btn-yellow flex items-center gap-1.5 text-xs"><BarChart2 size={13} />Report</button>
            <button onClick={() => { setEditingEmp(null); setEmpForm({ ...EMP_EMPTY }); setShowEmp(true) }} className="btn-secondary flex items-center gap-1.5 text-xs"><Plus size={13} />Add Employee</button>
            <button onClick={() => { setPayForm({ ...PAY_EMPTY }); setShowPay(true) }} className="btn-primary flex items-center gap-1.5 text-xs"><Plus size={13} />Record Payment</button>
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card border border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Employees</p>
            <p className="text-2xl font-bold text-blue-400 mt-0.5">{summary?.employee_count ?? '—'}</p>
          </div>
          <div className="card border border-yellow-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-yellow-400 mt-0.5">${Number(summary?.total_paid || 0).toLocaleString()}</p>
          </div>
          <div className="card border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Cash Payments</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">
              ${payments.filter(p => p.payment_method === 'Cash').reduce((s, p) => s + p.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="card border border-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-400 rounded-l-xl opacity-60" />
            <p className="text-xs text-gray-500">Check Payments</p>
            <p className="text-2xl font-bold text-purple-400 mt-0.5">
              ${payments.filter(p => p.payment_method === 'Check').reduce((s, p) => s + p.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-5 border-b border-neutral-800">
          {[{ key: 'employees', label: `Employees (${employees.length})` }, { key: 'payments', label: `Payments (${payments.length})` }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`pb-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${tab === key ? 'border-red-500 text-red-400' : 'border-transparent text-gray-500 hover:text-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Employees table */}
        {tab === 'employees' && (
          <div className="card overflow-hidden !p-0 border border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="border-b border-neutral-800 bg-neutral-900/80">
                  <tr>{['Name', 'Role', 'Added', ''].map(h => (
                    <th key={h} className="th text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {employees.length === 0 && (
                    <tr><td colSpan={4} className="py-16 text-center">
                      <Users size={32} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No employees yet</p>
                    </td></tr>
                  )}
                  {employees.map((emp, i) => (
                    <tr key={emp.id} className="hover:bg-neutral-800/50 transition-all duration-150 group">
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: EMP_COLORS[i % EMP_COLORS.length] }}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{emp.name}</span>
                        </div>
                      </td>
                      <td className="td">
                        {emp.role
                          ? <span className="px-2 py-0.5 bg-neutral-700/60 border border-neutral-600/50 rounded text-xs text-gray-300">{emp.role}</span>
                          : <span className="text-gray-600 text-xs">—</span>}
                      </td>
                      <td className="td text-gray-500 text-xs">{fmtDate(emp.created_at)}</td>
                      <td className="td">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingEmp(emp); setEmpForm({ name: emp.name, role: emp.role || '' }); setShowEmp(true) }}
                            className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all"><Pencil size={13} /></button>
                          <button onClick={async () => { if (!confirm('Delete employee?')) return; await deleteEmployee(emp.id); toast.success('Deleted'); load() }}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments table */}
        {tab === 'payments' && (
          <div className="card overflow-hidden !p-0 border border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-neutral-800 bg-neutral-900/80">
                  <tr>{['Employee', 'Amount', 'Method', 'Hours Worker', 'Date', 'Notes', ''].map(h => (
                    <th key={h} className="th text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {payments.length === 0 && (
                    <tr><td colSpan={7} className="py-16 text-center">
                      <DollarSign size={32} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No payments yet</p>
                    </td></tr>
                  )}
                  {payments.map((p, i) => {
                    const empIdx = employees.findIndex(e => e.name === p.employee_name)
                    const color = EMP_COLORS[empIdx >= 0 ? empIdx % EMP_COLORS.length : i % EMP_COLORS.length]
                    return (
                      <tr key={p.id} className="hover:bg-neutral-800/50 transition-all duration-150 group">
                        <td className="td">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ background: color }}>
                              {p.employee_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white text-sm">{p.employee_name}</span>
                          </div>
                        </td>
                        <td className="td text-yellow-400 font-bold">${Number(p.amount).toLocaleString()}</td>
                        <td className="td">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            p.payment_method === 'Cash'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>{p.payment_method}</span>
                        </td>
                        <td className="td text-gray-400 text-xs">{p.hours_worked || '—'}</td>
                        <td className="td text-gray-400 text-xs">{fmtDate(p.payment_date)}</td>
                        <td className="td text-gray-500 text-xs">{p.notes || '—'}</td>
                        <td className="td">
                          <button onClick={async () => { if (!confirm('Delete?')) return; await deletePayment(p.id); toast.success('Deleted'); load() }}
                            className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Employee */}
      {showEmp && (
        <Modal title={editingEmp ? 'Edit Employee' : 'Add Employee'} onClose={() => setShowEmp(false)}>
          <form onSubmit={handleSaveEmp} className="space-y-3">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={empForm.name} onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))} required placeholder="John Smith" autoFocus />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" value={empForm.role} onChange={e => setEmpForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Chef, Waiter" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowEmp(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Payment */}
      {showPay && (
        <Modal title="Record Payment" onClose={() => setShowPay(false)}>
          <form onSubmit={handlePayment} className="space-y-3">
            <div>
              <label className="label">Employee *</label>
              <select className="input" value={payForm.employee_id} onChange={e => setPayForm(f => ({ ...f, employee_id: e.target.value }))} required>
                <option value="">Select employee…</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}{emp.role ? ` — ${emp.role}` : ''}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount ($) *</label>
                <input className="input" type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00" />
              </div>
              <div>
                <label className="label">Payment Method *</label>
                <select className="input" value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Payment Date *</label>
                <input className="input" type="date" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Hours Worker <span className="text-gray-600">(optional)</span></label>
                <input className="input" type="text" value={payForm.hours_worked} onChange={e => setPayForm(f => ({ ...f, hours_worked: e.target.value }))} placeholder="e.g. 9-5, 40hrs" />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. March salary" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowPay(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Record'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payroll Report */}
      {showReport && (
        <Modal title="Payroll Report" onClose={() => setShowReport(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">From</label><input className="input" type="date" value={reportRange.start} onChange={e => setReportRange(r => ({ ...r, start: e.target.value }))} /></div>
              <div><label className="label">To</label><input className="input" type="date" value={reportRange.end} onChange={e => setReportRange(r => ({ ...r, end: e.target.value }))} /></div>
            </div>
            <div>
              <label className="label">Filter by Employee</label>
              <select className="input" value={reportRange.employee_id} onChange={e => setReportRange(r => ({ ...r, employee_id: e.target.value }))}>
                <option value="">All Employees</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <button onClick={runReport} className="btn-yellow w-full">Run Report</button>

            {report && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Paid', value: `$${Number(report.total).toLocaleString()}`, color: 'text-yellow-400', border: 'border-yellow-500/20', bar: 'bg-yellow-400' },
                    { label: 'Cash', value: `$${Number(report.by_method?.Cash || 0).toLocaleString()}`, color: 'text-emerald-400', border: 'border-emerald-500/20', bar: 'bg-emerald-400' },
                    { label: 'Check', value: `$${Number(report.by_method?.Check || 0).toLocaleString()}`, color: 'text-blue-400', border: 'border-blue-500/20', bar: 'bg-blue-400' },
                  ].map(({ label, value, color, border, bar }) => (
                    <div key={label} className={`bg-neutral-800/60 border ${border} rounded-xl p-3 text-center relative overflow-hidden`}>
                      <div className={`absolute top-0 left-0 w-1 h-full ${bar} rounded-l-xl opacity-60`} />
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className={`text-lg font-bold ${color} mt-0.5`}>{value}</p>
                    </div>
                  ))}
                </div>

                {Object.keys(report.by_employee || {}).length > 1 && (
                  <div className="bg-neutral-800/40 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">By Employee</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={Object.entries(report.by_employee).map(([name, amt], i) => ({ name, amt, fill: EMP_COLORS[i % EMP_COLORS.length] }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip contentStyle={{ background: '#171717', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }} formatter={v => [`$${v}`, 'Paid']} />
                        <Bar dataKey="amt" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {Object.entries(report.by_employee).map((_, i) => (
                            <Cell key={i} fill={EMP_COLORS[i % EMP_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {report.payments?.map((p, i) => {
                    const empIdx = employees.findIndex(e => e.name === p.employee_name)
                    const color = EMP_COLORS[empIdx >= 0 ? empIdx % EMP_COLORS.length : i % EMP_COLORS.length]
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-neutral-800/60 border border-neutral-700/50 rounded-xl px-3 py-2.5 hover:border-neutral-600 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: color }}>
                            {p.employee_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{p.employee_name}</p>
                            <p className="text-xs text-gray-500">
                              {fmtDate(p.payment_date)} ·{' '}
                              <span className={p.payment_method === 'Cash' ? 'text-emerald-400' : 'text-blue-400'}>{p.payment_method}</span>
                              {p.hours_worked ? ` · ${p.hours_worked}` : ''}
                              {p.notes ? ` · ${p.notes}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-yellow-400 font-bold">${Number(p.amount).toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Sidebar>
  )
}