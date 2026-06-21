import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES } from '../../lib/constants'
import { Send, Bell, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

export default function Notices() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    recipient: 'all',
    class: '',
  })

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notices')
        .insert({
          title: form.title,
          body: form.body,
          recipient: form.recipient,
          class: form.recipient === 'class' ? form.class : null,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      toast.success('Notice sent!')
      setShowForm(false)
      setForm({ title: '', body: '', recipient: 'all', class: '' })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      toast.success('Notice deleted!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleSend = () => {
    if (!form.title || !form.body) {
      toast.error('Please fill in title and message')
      return
    }
    if (form.recipient === 'class' && !form.class) {
      toast.error('Please select a class')
      return
    }
    sendMutation.mutate()
  }

  const recipientLabel = (notice: any) => {
    if (notice.recipient === 'class') return `Class: ${notice.class}`
    if (notice.recipient === 'teachers') return 'Teachers'
    if (notice.recipient === 'pta') return 'PTA Board Members'
    if (notice.recipient === 'parents') return 'All Parents'
    if (notice.recipient === 'students') return 'All Students'
    return 'Everyone'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-school-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-school-blue transition-colors"
        >
          <Send size={16} />
          Send Notice
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">Loading...</div>
        ) : notices?.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
            <Bell size={40} className="mx-auto mb-2 opacity-50" />
            <p>No notices sent yet</p>
          </div>
        ) : (
          notices?.map((notice: any) => (
            <div key={notice.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-school-dark">{notice.title}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {recipientLabel(notice)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notice.body}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => { if (confirm('Delete this notice?')) deleteMutation.mutate(notice.id) }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-school-dark">Send Notice</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Notice title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Write your notice here..."
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send To *</label>
                <select
                  value={form.recipient}
                  onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  <option value="all">All (Parents & Students)</option>
                  <option value="parents">All Parents</option>
                  <option value="students">All Students</option>
                  <option value="teachers">Teachers</option>
                  <option value="pta">PTA Board Members</option>
                  <option value="class">Specific Class</option>
                </select>
              </div>
              {form.recipient === 'class' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Class *</label>
                  <select
                    value={form.class}
                    onChange={(e) => setForm({ ...form, class: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  className="flex-1 bg-school-dark text-white rounded-lg py-2.5 text-sm font-medium hover:bg-school-blue disabled:opacity-50"
                >
                  {sendMutation.isPending ? 'Sending...' : 'Send Notice'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
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
