import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES, TERMS } from '../../lib/constants'
import { Search, CheckCircle, XCircle, DollarSign, Settings, Bell } from 'lucide-react'
import { toast } from 'sonner'

export default function FeeManagement() {
  const qc = useQueryClient()
  const [selectedTerm, setSelectedTerm] = useState('First')
  const [selectedSession, setSelectedSession] = useState('2024/2025')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'payments' | 'settings'>('payments')
  const [selectedClass, setSelectedClass] = useState('')
  const [feeAmounts, setFeeAmounts] = useState<Record<string, string>>({})

  const { data: students } = useQuery({
    queryKey: ['students-fees', selectedClass],
    queryFn: async () => {
      let query = supabase.from('students').select('*').order('full_name')
      if (selectedClass) query = query.eq('class', selectedClass)
      const { data } = await query
      return data ?? []
    }
  })

  const { data: classFees } = useQuery({
    queryKey: ['class-fees', selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('class_fees')
        .select('*')
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
      const map: Record<string, number> = {}
      data?.forEach((f: any) => { map[f.class] = f.amount })
      setFeeAmounts(Object.fromEntries(
        Object.entries(map).map(([k, v]) => [k, String(v)])
      ))
      return data ?? []
    }
  })

  const { data: payments } = useQuery({
    queryKey: ['fee-payments', selectedClass, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('fee_payments')
        .select('*, students(full_name, class, parent_phone)')
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
      return data ?? []
    }
  })

  const { data: notifications } = useQuery({
    queryKey: ['fee-notifications', selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('fee_payments')
        .select('*, students(full_name, class)')
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
        .eq('status', 'notified')
      return data ?? []
    }
  })

  const saveFeeMutation = useMutation({
    mutationFn: async ({ cls, amount }: { cls: string, amount: number }) => {
      const { error } = await supabase
        .from('class_fees')
        .upsert({
          class: cls,
          amount,
          term: selectedTerm,
          session: selectedSession,
        }, { onConflict: 'class' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-fees'] })
      toast.success('Fee saved!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string, status: string }) => {
      const student = students?.find((s: any) => s.id === studentId)
      const feeAmount = classFees?.find((f: any) => f.class === student?.class)?.amount ?? 0
      const existing = payments?.find((p: any) => p.student_id === studentId)
      if (existing) {
        const { error } = await supabase
          .from('fee_payments')
          .update({
            status,
            payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
            confirmed_by: status === 'paid' ? 'admin' : null,
          })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('fee_payments')
          .insert({
            student_id: studentId,
            amount: feeAmount,
            term: selectedTerm,
            session: selectedSession,
            status,
            payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
            confirmed_by: status === 'paid' ? 'admin' : null,
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-payments'] })
      qc.invalidateQueries({ queryKey: ['fee-notifications'] })
      toast.success('Payment status updated!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const getPaymentStatus = (studentId: string) => {
    return payments?.find((p: any) => p.student_id === studentId)?.status ?? 'unpaid'
  }

  const getPaymentDate = (studentId: string) => {
    return payments?.find((p: any) => p.student_id === studentId)?.payment_date
  }

  const getFeeForClass = (cls: string) => {
    return classFees?.find((f: any) => f.class === cls)?.amount ?? 0
  }

  const filtered = students?.filter((s: any) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const paidCount = payments?.filter((p: any) => p.status === 'paid').length ?? 0
  const unpaidCount = (students?.length ?? 0) - paidCount
  const notifiedCount = notifications?.length ?? 0
  const totalCollected = payments
    ?.filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0) ?? 0

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold text-green-700">{paidCount}</p>
          <p className="text-sm text-green-600">Paid</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <XCircle size={24} className="mx-auto mb-2 text-red-500" />
          <p className="text-2xl font-bold text-red-700">{unpaidCount}</p>
          <p className="text-sm text-red-600">Unpaid</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <Bell size={24} className="mx-auto mb-2 text-yellow-500" />
          <p className="text-2xl font-bold text-yellow-700">{notifiedCount}</p>
          <p className="text-sm text-yellow-600">Notified</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <DollarSign size={24} className="mx-auto mb-2 text-blue-500" />
          <p className="text-xl font-bold text-blue-700">
            ₦{totalCollected.toLocaleString()}
          </p>
          <p className="text-sm text-blue-600">Collected</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-1 shadow-sm flex gap-1">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-school-dark text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Payment Status
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-school-dark text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Set Fees Per Class
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          >
            {TERMS.map(t => (
              <option key={t} value={t}>{t} Term</option>
            ))}
          </select>
          <input
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            placeholder="Session e.g 2024/2025"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
          {activeTab === 'payments' && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
            >
              <option value="">All Classes</option>
              {CLASSES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* SET FEES PER CLASS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-school-dark">
              Set Fee Per Class — {selectedTerm} Term {selectedSession}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Set how much each class pays per term
            </p>
          </div>
          <div className="divide-y">
            {CLASSES.map(cls => (
              <div key={cls} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm">{cls}</p>
                  <p className="text-xs text-gray-500">
                    Current: ₦{getFeeForClass(cls).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">₦</span>
                    <input
                      type="number"
                      value={feeAmounts[cls] ?? ''}
                      onChange={(e) => setFeeAmounts({ ...feeAmounts, [cls]: e.target.value })}
                      className="w-32 border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                      placeholder="Amount"
                    />
                  </div>
                  <button
                    onClick={() => saveFeeMutation.mutate({
                      cls,
                      amount: Number(feeAmounts[cls] ?? 0)
                    })}
                    disabled={saveFeeMutation.isPending}
                    className="bg-school-dark text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-school-blue disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAYMENT STATUS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
              />
            </div>
          </div>
          <div className="divide-y">
            {filtered?.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No students found</p>
              </div>
            ) : (
              filtered?.map((student: any) => {
                const status = getPaymentStatus(student.id)
                const paymentDate = getPaymentDate(student.id)
                const feeAmount = getFeeForClass(student.class)
                return (
                  <div key={student.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-school-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {student.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {student.class} • Fee: ₦{feeAmount.toLocaleString()}
                          </p>
                          {paymentDate && (
                            <p className="text-xs text-green-600">
                              Paid on: {new Date(paymentDate).toLocaleDateString()}
                            </p>
                          )}
                          {status === 'notified' && (
                            <p className="text-xs text-yellow-600">
                              ⏳ Parent notified admin of payment
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          status === 'paid' ? 'bg-green-100 text-green-700' :
                          status === 'notified' ? 'bg-yellow-100 text-yellow-700' :
                          status === 'partial' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {status}
                        </span>
                        <select
                          value={status}
                          onChange={(e) => updatePaymentMutation.mutate({
                            studentId: student.id,
                            status: e.target.value
                          })}
                          className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-school-dark"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="partial">Partial</option>
                          <option value="notified">Notified</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
                }
