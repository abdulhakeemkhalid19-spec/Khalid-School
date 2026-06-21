import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Search, Plus, X, Wallet, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = ['School Fees', 'Uniform', 'Books and Stationeries', 'Others']

export default function PaymentList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({})

  const { data: students } = useQuery({
    queryKey: ['students-payment-list'],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*').order('full_name')
      return data ?? []
    }
  })

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-records', category],
    queryFn: async () => {
      let query = supabase
        .from('payment_records')
        .select('*, students(full_name, class, admission_no)')
        .order('payment_time', { ascending: false })
      if (category) query = query.eq('category', category)
      const { data } = await query
      return data ?? []
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('payment_records')
        .insert({
          student_id: data.student_id,
          category: data.category,
          amount_paid: Number(data.amount_paid),
          total_amount: Number(data.total_amount),
          notes: data.notes,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-records'] })
      toast.success('Payment recorded!')
      setShowForm(false)
      setForm({})
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_records').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-records'] })
      toast.success('Payment deleted!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = payments?.filter((p: any) =>
    p.students?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = () => {
    if (!form.student_id || !form.category || !form.total_amount) {
      toast.error('Please fill required fields')
      return
    }
    saveMutation.mutate(form)
  }

  const totalCollected = payments?.reduce((sum: number, p: any) => sum + (p.amount_paid ?? 0), 0) ?? 0

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <Wallet size={24} className="mx-auto mb-2 text-blue-500" />
        <p className="text-2xl font-bold text-blue-700">₦{totalCollected.toLocaleString()}</p>
        <p className="text-sm text-blue-600">Total Collected {category ? `(${category})` : '(All Categories)'}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => { setShowForm(true); setForm({}) }}
          className="flex items-center gap-2 bg-school-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-school-blue"
        >
          <Plus size={16} />
          Record Payment
        </button>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered?.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Wallet size={40} className="mx-auto mb-2 opacity-50" />
            <p>No payment records found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered?.map((p: any) => {
              const remaining = (p.total_amount ?? 0) - (p.amount_paid ?? 0)
              const isFull = remaining <= 0
              return (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{p.students?.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {p.students?.class} • {p.category}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(p.payment_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-school-dark">
                      ₦{(p.amount_paid ?? 0).toLocaleString()} / ₦{(p.total_amount ?? 0).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isFull ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isFull ? 'Full Payment' : `Remaining ₦${remaining.toLocaleString()}`}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Delete this payment record?')) deleteMutation.mutate(p.id)
                      }}
                      className="block mt-1 ml-auto p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-school-dark">Record Payment</h2>
              <button onClick={() => { setShowForm(false); setForm({}) }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  value={form.student_id ?? ''}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  <option value="">Select Student</option>
                  {students?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.full_name} — {s.class}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={form.category ?? ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount Due *</label>
                <input
                  type="number"
                  value={form.total_amount ?? ''}
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="e.g. 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
                <input
                  type="number"
                  value={form.amount_paid ?? ''}
                  onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="e.g. 30000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes ?? ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-school-dark text-white rounded-lg py-2.5 text-sm font-medium hover:bg-school-blue disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Record Payment'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm({}) }}
                  className="flex-1 border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
        }
