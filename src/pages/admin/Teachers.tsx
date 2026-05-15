import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES } from '../../lib/constants'
import { UserPlus, Search, Edit, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Teacher {
  id: string
  full_name: string
  email: string
  phone?: string
  type: 'primary' | 'secondary'
  assigned_class?: string
  subject?: string
  is_also_subject_teacher?: boolean
}

export default function Teachers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [form, setForm] = useState<Partial<Teacher>>({})

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('teachers')
        .select('*')
        .order('full_name')
      return data ?? []
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Teacher>) => {
      if (editing) {
        const { error } = await supabase
          .from('teachers')
          .update(data)
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('teachers')
          .insert(data)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      toast.success(editing ? 'Teacher updated!' : 'Teacher added!')
      setShowForm(false)
      setEditing(null)
      setForm({})
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      toast.success('Teacher deleted!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = teachers?.filter((t: Teacher) =>
    t.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (t: Teacher) => {
    setEditing(t)
    setForm(t)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.full_name || !form.email || !form.type) {
      toast.error('Please fill required fields')
      return
    }
    saveMutation.mutate(form)
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({}) }}
          className="flex items-center gap-2 bg-school-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-school-blue transition-colors"
        >
          <UserPlus size={16} />
          Add Teacher
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered?.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>No teachers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-school-dark text-white">
                <tr>
                  <th className="text-left p-3 text-sm">Name</th>
                  <th className="text-left p-3 text-sm">Email</th>
                  <th className="text-left p-3 text-sm">Type</th>
                  <th className="text-left p-3 text-sm">Class/Subject</th>
                  <th className="text-left p-3 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((t: Teacher) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium">{t.full_name}</td>
                    <td className="p-3 text-sm">{t.email}</td>
                    <td className="p-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="capitalize">{t.type}</span>
                        {t.is_also_subject_teacher && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            + Subject Teacher
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex flex-col gap-1">
                        {t.type === 'primary' && (
                          <span>{t.assigned_class ?? '—'}</span>
                        )}
                        {(t.type === 'secondary' || t.is_also_subject_teacher) && (
                          <span className="text-blue-600">{t.subject ?? '—'}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this teacher?')) {
                              deleteMutation.mutate(t.id)
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-school-dark">
                {editing ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm({}) }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  value={form.full_name ?? ''}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="teacher@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="08012345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher Type *
                </label>
                <select
                  value={form.type ?? ''}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  <option value="">Select Type</option>
                  <option value="primary">Primary/Form Teacher</option>
                  <option value="secondary">Secondary/Subject Teacher</option>
                </select>
              </div>
              {form.type === 'primary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Class
                  </label>
                  <select
                    value={form.assigned_class ?? ''}
                    onChange={(e) => setForm({ ...form, assigned_class: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.type === 'primary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Also a Subject Teacher?
                  </label>
                  <select
                    value={form.is_also_subject_teacher ? 'yes' : 'no'}
                    onChange={(e) => setForm({
                      ...form,
                      is_also_subject_teacher: e.target.value === 'yes'
                    })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              )}
              {(form.type === 'secondary' || form.is_also_subject_teacher) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Teaching
                  </label>
                  <input
                    value={form.subject ?? ''}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    placeholder="e.g. Mathematics"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-school-dark text-white rounded-lg py-2.5 text-sm font-medium hover:bg-school-blue transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editing ? 'Update Teacher' : 'Add Teacher'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditing(null); setForm({}) }}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
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
