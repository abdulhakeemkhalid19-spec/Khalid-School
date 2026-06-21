import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES, DEPARTMENTS } from '../../lib/constants'
import { UserPlus, Search, Edit, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  full_name: string
  age: number
  class: string
  gender: string
  department?: string
  student_email?: string
  parent_email?: string
  parent_phone?: string
  hobby?: string
  club?: string
  blood_group?: string
  genotype?: string
  allergies?: string
  medical_conditions?: string
  admission_date?: string
  admission_time?: string
  admission_no?: string
}

const isSecondary = (cls: string) => cls.startsWith('SS')

export default function Students() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState<Partial<Student>>({})
  const [filterClass, setFilterClass] = useState('')

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*').order('full_name')
      return data ?? []
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => {
      if (editing) {
        const { error } = await supabase.from('students').update(data).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('students').insert(data)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success(editing ? 'Student updated!' : 'Student added!')
      setShowForm(false)
      setEditing(null)
      setForm({})
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student deleted!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = students?.filter((s: Student) => {
    const matchSearch = s.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchClass = filterClass ? s.class === filterClass : true
    return matchSearch && matchClass
  })

  const openEdit = (s: Student) => {
    setEditing(s)
    setForm(s)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.full_name || !form.class || !form.gender) {
      toast.error('Please fill required fields')
      return
    }
    saveMutation.mutate(form)
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
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
        >
          <option value="">All Classes</option>
          {CLASSES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({}) }}
          className="flex items-center gap-2 bg-school-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-school-blue transition-colors"
        >
          <UserPlus size={16} />
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered?.length === 0 ? (
          <div className="p-8 text-center text-gray-400"><p>No students found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-school-dark text-white">
                <tr>
                  <th className="text-left p-3 text-sm">Admission No.</th>
                  <th className="text-left p-3 text-sm">Name</th>
                  <th className="text-left p-3 text-sm">Class</th>
                  <th className="text-left p-3 text-sm">Gender</th>
                  <th className="text-left p-3 text-sm">Department</th>
                  <th className="text-left p-3 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((s: Student) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{s.admission_no ?? '—'}</td>
                    <td className="p-3 text-sm font-medium">{s.full_name}</td>
                    <td className="p-3 text-sm">{s.class}</td>
                    <td className="p-3 text-sm">{s.gender}</td>
                    <td className="p-3 text-sm">{s.department ?? '—'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded">
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this student?')) deleteMutation.mutate(s.id) }}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-school-dark">
                {editing ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm({}) }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-2">Admission Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Admission No.</label>
                    <input
                      value={form.admission_no ?? ''}
                      onChange={(e) => setForm({ ...form, admission_no: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                      placeholder="e.g. KFP/2024/001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date of Admission</label>
                    <input
                      type="date"
                      value={form.admission_date ?? ''}
                      onChange={(e) => setForm({ ...form, admission_date: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Time of Admission</label>
                    <input
                      type="time"
                      value={form.admission_time ?? ''}
                      onChange={(e) => setForm({ ...form, admission_time: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    value={form.class ?? ''}
                    onChange={(e) => setForm({ ...form, class: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
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
                {isSecondary(form.class ?? '') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={form.department ?? ''}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
                  <input
                    type="email"
                    value={form.student_email ?? ''}
                    onChange={(e) => setForm({ ...form, student_email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    placeholder="student@gmail.com"
                  />
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hobby</label>
                  <input
                    value={form.hobby ?? ''}
                    onChange={(e) => setForm({ ...form, hobby: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    placeholder="e.g. Reading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
                  <input
                    value={form.club ?? ''}
                    onChange={(e) => setForm({ ...form, club: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    placeholder="e.g. Science Club"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={form.blood_group ?? ''}
                    onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  >
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genotype</label>
                  <select
                    value={form.genotype ?? ''}
                    onChange={(e) => setForm({ ...form, genotype: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  >
                    <option value="">Select</option>
                    {['AA', 'AS', 'SS', 'AC'].map(g => (<option key={g} value={g}>{g}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                  <input
                    value={form.allergies ?? ''}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    placeholder="e.g. Peanuts, Dust"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                  <textarea
                    value={form.medical_conditions ?? ''}
                    onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                    placeholder="Any medical conditions..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-school-dark text-white rounded-lg py-2.5 text-sm font-medium hover:bg-school-blue transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editing ? 'Update Student' : 'Add Student'}
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
