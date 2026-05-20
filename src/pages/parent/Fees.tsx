import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { TERMS, BANK_DETAILS } from '../../lib/constants'
import { useState } from 'react'
import { CheckCircle, XCircle, Bell, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

export default function ParentFees() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedTerm, setSelectedTerm] = useState('First')
  const [selectedSession, setSelectedSession] = useState('2024/2025')

  const { data: child } = useQuery({
    queryKey: ['parent-child', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('parent_email', user?.email)
        .single()
      return data
    },
    enabled: !!user
  })

  const { data: classFee } = useQuery({
    queryKey: ['class-fee', child?.class, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('class_fees')
        .select('*')
        .eq('class', child?.class)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
        .single()
      return data
    },
    enabled: !!child?.class
  })

  const { data: payment } = useQuery({
    queryKey: ['fee-payment-parent', child?.id, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('student_id', child?.id)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
        .single()
      return data
    },
    enabled: !!child?.id
  })

  const notifyMutation = useMutation({
    mutationFn: async () => {
      if (payment) {
        const { error } = await supabase
          .from('fee_payments')
          .update({
            status: 'notified',
            notified_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('fee_payments')
          .insert({
            student_id: child?.id,
            amount: classFee?.amount ?? 0,
            term: selectedTerm,
            session: selectedSession,
            status: 'notified',
            notified_at: new Date().toISOString(),
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-payment-parent'] })
      toast.success('Admin has been notified of your payment!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  if (!child) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <p>No child linked to your account yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Term Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
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
        </div>
      </div>

      {/* Fee Status Card */}
      <div className={`rounded-xl p-6 shadow-sm ${
        payment?.status === 'paid'
          ? 'bg-green-50 border border-green-200'
          : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          {payment?.status === 'paid' ? (
            <CheckCircle size={32} className="text-green-500" />
          ) : (
            <XCircle size={32} className="text-red-500" />
          )}
          <div>
            <h3 className="font-bold text-school-dark">
              {payment?.status === 'paid' ? 'Fee Paid ✅' :
               payment?.status === 'notified' ? 'Payment Pending Confirmation ⏳' :
               'Fee Not Paid ❌'}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedTerm} Term — {selectedSession}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Student:</span>
            <span className="font-medium">{child.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Class:</span>
            <span className="font-medium">{child.class}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Due:</span>
            <span className="font-bold text-school-dark text-lg">
              ₦{(classFee?.amount ?? 0).toLocaleString()}
            </span>
          </div>
          {payment?.payment_date && (
            <div className="flex justify-between">
              <span className="text-gray-500">Paid On:</span>
              <span className="font-medium text-green-600">
                {new Date(payment.payment_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bank Details */}
      {payment?.status !== 'paid' && (
        <div className="bg-school-dark text-white rounded-xl p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <CreditCard size={18} />
            Payment Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-300">Bank:</span>
              <span>{BANK_DETAILS.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">Account Name:</span>
              <span>{BANK_DETAILS.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">Account Number:</span>
              <span className="font-bold">{BANK_DETAILS.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">Amount:</span>
              <span className="font-bold text-green-300">
                ₦{(classFee?.amount ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notify Button */}
      {payment?.status !== 'paid' && (
        <div>
          {payment?.status === 'notified' ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <p className="text-yellow-700 text-sm font-medium">
                ⏳ You have notified the admin. Waiting for confirmation...
              </p>
            </div>
          ) : (
            <button
              onClick={() => notifyMutation.mutate()}
              disabled={notifyMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-school-dark text-white rounded-xl py-3 font-medium hover:bg-school-blue disabled:opacity-50"
            >
              <Bell size={18} />
              {notifyMutation.isPending ? 'Sending...' : 'I Have Paid — Notify Admin'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
