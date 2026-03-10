'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Modal from '@/components/Modal'
import { useAuth } from '@/lib/useAuth'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getPayments, createPayment, deletePayment, getPayrollSummary } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const EMP_EMPTY = { name:'', role:'', salary:'' }
const PAY_EMPTY = { employee_id:'', amount:'', payment_date:'', notes:'' }
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })

export default function PayrollPage() {
  const { loading } = useAuth()
  const [employees, setEmployees] = useState([])
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [tab, setTab] = useState('employees')
  const [showEmp, setShowEmp] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [editingEmp, setEditingEmp] = useState(null)
  const [empForm, setEmpForm] = useState({ ...EMP_EMPTY })
  const [payForm, setPayForm] = useState({ ...PAY_EMPTY })
  const [saving, setSaving] = useState(false)

  const load = () => {
    getEmployees().then(r => setEmployees(r.data)).catch(() => {})
    getPayments().then(r => setPayments(r.data)).catch(() => {})
    getPayrollSummary().then(r => setSummary(r.data)).catch(() => {})
  }
  useEffect(() => { if (!loading) load() }, [loading])

  const setEmp = (k, v) => setEmpForm(f => ({ ...f, [k]: v }))
  const setPay = (k, v) => setPayForm(f => ({ ...f, [k]: v }))

  const openEmpEdit = (emp) => { setEditingEmp(emp); setEmpForm({ name: emp.name, role: emp.role || '', salary: emp.salary }); setShowEmp(true) }

  const handleSaveEmp = async (e) => {
    e.preventDefault(); setSaving(true)
    const data = { name: empForm.name, role: empForm.role || null, salary: parseFloat(empForm.salary) }
    try {
      editingEmp ? await updateEmployee(editingEmp.id, data) : await createEmployee(data)
      toast.success(editingEmp ? 'Updated' : 'Employee added')
      setShowEmp(false); load()
    } catch { toast.error('Error') } finally { setSaving(false) }
  }

  const handleDeleteEmp = async (id) => {
    if (!confirm('Delete employee?')) return
    await deleteEmployee(id); toast.success('Deleted'); load()
  }

  const handlePayment = async (e) => {
    e.preventDefault(); setSaving(true)
    const emp = employees.find(em => em.id === payForm.employee_id)
    try {
      await createPayment({ employee_id: payForm.employee_id, employee_name: emp?.name || '', amount: parseFloat(payForm.amount), payment_date: new Date(payForm.payment_date).toISOString(), notes: payForm.notes || null })
      toast.success('Payment recorded'); setShowPay(false); load()
    } catch { toast.error('Error') } finally { setSaving(false) }
  }

  const handleDeletePayment = async (id) => {
    if (!confirm('Delete?')) return
    await deletePayment(id); toast.success('Deleted'); load()
  }

  if (loading) return null

  return (
    <Sidebar>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Payroll</h1>
            <p className="text-sm text-gray-400 mt-0.5">Employees and salary payments</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditingEmp(null); setEmpForm({ ...EMP_EMPTY }); setShowEmp(true) }} className="btn-secondary flex items-center gap-2"><Plus size={14} />Add Employee</button>
            <button onClick={() => { setPayForm({ ...PAY_EMPTY }); setShowPay(true) }} className="btn-primary flex items-center gap-2"><Plus size={14} />Record Payment</button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center"><p className="text-xs text-gray-400">Employees</p><p className="text-2xl font-bold text-white mt-0.5">{summary.employee_count}</p></div>
            <div className="card text-center"><p className="text-xs text-gray-400">Monthly Est.</p><p className="text-2xl font-bold text-orange-400 mt-0.5">${Number(summary.monthly_salary_estimate).toLocaleString()}</p></div>
            <div className="card text-center"><p className="text-xs text-gray-400">Total Paid</p><p className="text-2xl font-bold text-white mt-0.5">${Number(summary.total_paid).toLocaleString()}</p></div>
          </div>
        )}

        <div className="flex gap-5 border-b border-neutral-800">
          {[{ key:'employees', label:`Employees (${employees.length})` },{ key:'payments', label:`Payments (${payments.length})` }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>{label}</button>
          ))}
        </div>

        {tab === 'employees' && (
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px]">
                <thead className="border-b border-neutral-800"><tr>{['Name','Role','Monthly Salary','Added',''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-neutral-800">
                  {employees.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-10 text-sm">No employees yet</td></tr>}
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="td font-medium text-white">{emp.name}</td>
                      <td className="td text-gray-400">{emp.role || '—'}</td>
                      <td className="td text-orange-400 font-medium">${Number(emp.salary).toLocaleString()}</td>
                      <td className="td text-gray-400">{fmtDate(emp.created_at)}</td>
                      <td className="td">
                        <div className="flex gap-1">
                          <button onClick={() => openEmpEdit(emp)} className="p-1.5 text-gray-400 hover:text-orange-400 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => handleDeleteEmp(emp.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px]">
                <thead className="border-b border-neutral-800"><tr>{['Employee','Amount','Date','Notes',''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-neutral-800">
                  {payments.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-10 text-sm">No payments yet</td></tr>}
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="td font-medium text-white">{p.employee_name}</td>
                      <td className="td text-blue-400 font-medium">${Number(p.amount).toLocaleString()}</td>
                      <td className="td text-gray-400">{fmtDate(p.payment_date)}</td>
                      <td className="td text-gray-500">{p.notes || '—'}</td>
                      <td className="td"><button onClick={() => handleDeletePayment(p.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showEmp && (
        <Modal title={editingEmp ? 'Edit Employee' : 'Add Employee'} onClose={() => setShowEmp(false)}>
          <form onSubmit={handleSaveEmp} className="space-y-3">
            <div><label className="label">Full Name *</label><input className="input" value={empForm.name} onChange={e => setEmp('name', e.target.value)} required placeholder="John Smith" /></div>
            <div><label className="label">Role</label><input className="input" value={empForm.role} onChange={e => setEmp('role', e.target.value)} placeholder="e.g. Chef, Waiter" /></div>
            <div><label className="label">Monthly Salary ($) *</label><input className="input" type="number" step="0.01" value={empForm.salary} onChange={e => setEmp('salary', e.target.value)} required placeholder="0.00" /></div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowEmp(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showPay && (
        <Modal title="Record Payment" onClose={() => setShowPay(false)}>
          <form onSubmit={handlePayment} className="space-y-3">
            <div><label className="label">Employee *</label>
              <select className="input" value={payForm.employee_id} onChange={e => setPay('employee_id', e.target.value)} required>
                <option value="">Select employee…</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — ${Number(emp.salary).toLocaleString()}/mo</option>)}
              </select>
            </div>
            <div><label className="label">Amount ($) *</label><input className="input" type="number" step="0.01" value={payForm.amount} onChange={e => setPay('amount', e.target.value)} required placeholder="0.00" /></div>
            <div><label className="label">Payment Date *</label><input className="input" type="date" value={payForm.payment_date} onChange={e => setPay('payment_date', e.target.value)} required /></div>
            <div><label className="label">Notes</label><input className="input" value={payForm.notes} onChange={e => setPay('notes', e.target.value)} placeholder="e.g. March salary" /></div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowPay(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Record'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Sidebar>
  )
}
