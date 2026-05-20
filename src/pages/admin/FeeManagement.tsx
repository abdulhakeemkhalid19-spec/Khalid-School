import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES, TERMS } from '../../lib/constants'
import { Search, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

export default function FeeManagement() {
  const qc = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('First')
  const [selectedSession, setSelectedSession] = useState('2024/2025')
  const [search, setSearch] = useState('')
  const [feeAmount, setFeeAmount] = useState('50000')

  const { data: students } = useQuery({
    queryKey: ['students-fees', selectedClass],
    queryFn: async () => {
      let query = supabase.from('students').select('*').order('full_name')
      if (selectedClass) query = query.eq('class', selectedClass)
      const { data } = await query
      return data ?? []
    }
  })

  const { data: payments } = useQuery({
    queryKey: ['fee-payments', selectedClass, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
      return data ?? []
    }
  })

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string, status: string }) => {
      const existing = payments?.find((p: any) => p.student_id === studentId)
      if (existing) {
        const { error } = await supabase
          .from('fee_payments')
          .update({
            status,
            payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
            amount: Number(feeAmount)
          })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('fee_payments')
          .insert({
            student_id: studentId,
            amount: Number(feeAmount),
            term: selectedTerm,
            session: selectedSession,
            status,
            payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-payments'] })
      toast.success('Payment status updated!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const getPaymentStatus = (studentId: string) => {
    return payments?.find((p: any) => p.student_id === studentId)?.status ?? 'unpaid'
  }

  const filtered = students?.filter((s: any) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const paidCount = payments?.filter((p: any) => p.status === 'paid').length ?? 0
  const unpaidCount = (students?.length ?? 0) - paidCount
  const totalCollected = payments
    ?.filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0) ?? 0

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <DollarSign size={24} className="mx-auto mb-2 text-blue-500" />
          <p className="text-xl font-bold text-blue-700">
            ₦{totalCollected.toLocaleString()}
          </p>
          <p className="text-sm text-blue-600">Collected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            placeholder="Session"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
          <input
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            placeholder="Fee Amount"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
        </div>
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
        </div>
      </div>

      {/* Students Fee Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-school-dark">
            Fee Status — {selectedTerm} Term {selectedSession}
          </h3>
        </div>
        <div className="divide-y">
          {filtered?.map((student: any) => {
            const status = getPaymentStatus(student.id)
            return (
              <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-school-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {student.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{student.full_name}</p>
                    <p className="text-xs text-gray-500">{student.class}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    status === 'paid' ? 'bg-green-100 text-green-700' :
                    status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
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
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
