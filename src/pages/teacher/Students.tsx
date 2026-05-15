import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { UserPlus, Search, Edit, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

export default function TeacherStudents() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  const { data: teacher } = useQuery({
    queryKey: ['teacher-profile', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', user?.email)
        .single()
      return data
    },
    enabled: !!user
  })

  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students', teacher?.assigned_class, teacher?.type],
    queryFn: async () => {
      if (teacher?.type === 'primary') {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('class', teacher?.assigned_class)
          .order('full_name')
        return data ?? []
      } else {
        const { data } = await supabase
          .from('students')
          .select('*')
          .order('class')
        return data ?? []
      }
    },
    enabled: !!teacher
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const studentData = {
        ...data,
        class: teacher?.type === 'primary' ? teacher?.assigned_class : data.class
      }
      if (editing) {
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('students')
          .insert(studentData)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-students'] })
      toast.success(editing ? 'Student updated!' : 'Student added!')
      setShowForm(false)
      setEditing(null)
      setForm({})
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-students'] })
      toast.success('Student deleted!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = students?.filter((s: any) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = () => {
    if (!form.full_name || !form.gender) {
      toast.error('Please fill required fields')
      return
    }
    saveMutation.mutate(form)
  }

  if (!teacher) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <p>Loading teacher profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
        {teacher?.type === 'primary' && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm({}) }}
            className="flex items-center gap-2 bg-school-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-school-blue"
          >
            <UserPlus size={16} />
            Add Student
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-school-dark">
            {teacher?.type === 'primary'
              ? `${teacher?.assigned_class} — ${students?.length ?? 0} Students`
              : `All Students offering ${teacher?.subject} — ${students?.length ?? 0} Students`}
          </h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered?.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No students found</div>
        ) : (
          <div className="divide-y">
            {filtered?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-school-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {s.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {s.class} {s.gender ? `• ${s.gender}` : ''}
                      {teacher?.type === 'secondary' ? ` • ${s.class}` : ''}
                    </p>
                  </div>
                </div>
                {teacher?.type === 'primary' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(s); setForm(s); setShowForm(true) }}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this student?')) {
                          deleteMutation.mutate(s.id)
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && teacher?.type === 'primary' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-school-dark">
                {editing ? 'Edit Student' : 'Add Student'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm({}) }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  value={form.full_name ?? ''}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={form.age ?? ''}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  value={form.gender ?? ''}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                <input
                  type="email"
                  value={form.parent_email ?? ''}
                  onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="parent@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                <input
                  value={form.parent_phone ?? ''}
                  onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="08012345678"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-school-dark text-white rounded-lg py-2.5 text-sm font-medium hover:bg-school-blue disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Add Student'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditing(null); setForm({}) }}
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
