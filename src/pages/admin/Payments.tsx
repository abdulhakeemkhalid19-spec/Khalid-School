import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { BANK_DETAILS } from '../../lib/constants'
import { CheckCircle, XCircle, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

export default function Payments() {
  const qc = useQueryClient()

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('report_card_access')
        .select('*, students(full_name, class)')
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_card_access')
        .update({ status: 'approved' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Report card access activated!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_card_access')
        .update({ status: 'revoked' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Access revoked!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-700'
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
    if (status === 'revoked') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  const pending = payments?.filter((p: any) => p.status === 'pending') ?? []
  const approved = payments?.filter((p: any) => p.status === 'approved') ?? []
  const revoked = payments?.filter((p: any) => p.status === 'revoked') ?? []

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{pending.length}</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{approved.length}</p>
          <p className="text-sm text-green-600">Approved</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{revoked.length}</p>
          <p className="text-sm text-red-600">Revoked</p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-school-dark text-white rounded-xl p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <CreditCard size={18} />
          School Bank Details
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-blue-300 text-xs">Bank Name</p>
            <p className="font-medium">{BANK_DETAILS.bankName}</p>
          </div>
          <div>
            <p className="text-blue-300 text-xs">Account Name</p>
            <p className="font-medium">{BANK_DETAILS.accountName}</p>
          </div>
          <div>
            <p className="text-blue-300 text-xs">Account Number</p>
            <p className="font-medium">{BANK_DETAILS.accountNumber}</p>
          </div>
          <div>
            <p className="text-blue-300 text-xs">Amount</p>
            <p className="font-bold text-green-300">{BANK_DETAILS.amount}</p>
          </div>
        </div>
      </div>

      {/* Payment Requests */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-school-dark">Payment Requests</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : payments?.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CreditCard size={40} className="mx-auto mb-2 opacity-50" />
            <p>No payment requests yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {payments?.map((p: any) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {p.students?.full_name ?? 'Unknown Student'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Class: {p.students?.class} •{' '}
                    Parent: {p.parent_email}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${statusColor(p.status)}`}>
                    {p.status}
                  </span>
                  {p.status === 'pending' && (
                    <button
                      onClick={() => activateMutation.mutate(p.id)}
                      disabled={activateMutation.isPending}
                      className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      <CheckCircle size={13} />
                      Activate
                    </button>
                  )}
                  {p.status === 'approved' && (
                    <button
                      onClick={() => revokeMutation.mutate(p.id)}
                      disabled={revokeMutation.isPending}
                      className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
