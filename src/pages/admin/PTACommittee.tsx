import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Search, Plus, Trash2, Users, X } from 'lucide-react'
import { toast } from 'sonner'

export default function PTACommittee() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [memberType, setMemberType] = useState<'teacher' | 'parent'>('teacher')
  const [selectedId, setSelectedId] = useState('')
  const [position, setPosition] = useState('')

  const { data: teachers } = useQuery({
    queryKey: ['teachers-pta'],
    queryFn: async () => {
      const { data } = await supabase.from('teachers').select('*').order('full_name')
      return data ?? []
    }
  })

  const { data: students } = useQuery({
    queryKey: ['students-for-parents-pta'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('parent_email, full_name')
        .not('parent_email', 'is', null)
      // Get unique parents
      const uniqueParents = Array.from(
        new Map(data?.map((s: any) => [s.parent_email, s])).values()
      )
      return uniqueParents
    }
  })

  const { data: committee, isLoading } = useQuery({
    queryKey: ['pta-committee'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pta_committee')
        .select('*')
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      let memberName = ''
      let memberEmail = ''

      if (memberType === 'teacher') {
        const teacher = teachers?.find((t: any) => t.id === selectedId)
        memberName = teacher?.full_name ?? ''
        memberEmail = teacher?.email ?? ''
      } else {
        const parent = students?.find((s: any) => s.parent_email === selectedId)
        memberName = `Parent of ${parent?.full_name}`
        memberEmail = selectedId
      }

      const { error } = await supabase
        .from('pta_committee')
        .insert({
          member_type: memberType,
          member_id: memberType === 'teacher' ? selectedId : null,
          member_name: memberName,
          member_email: memberEmail,
          position,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pta-committee'] })
      toast.success('Member added to PTA Committee!')
      setShowForm(false)
      setSelectedId('')
      setPosition('')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pta_committee').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pta-committee'] })
      toast.success('Member removed!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = committee?.filter((c: any) =>
    c.member_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    if (!selectedId) {
      toast.error('Please select a member')
      return
    }
    addMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PTA members..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-school-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-school-blue"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-school-dark">
            PTA Committee — {committee?.length ?? 0} members
          </h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered?.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-2 opacity-50" />
            <p>No PTA committee members yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered?.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-school-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {member.member_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.member_name}</p>
                    <p className="text-xs text-gray-500">
                      {member.member_email} • <span className="capitalize">{member.member_type}</span>
                      {member.position && ` • ${member.position}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm('Remove this member?')) deleteMutation.mutate(member.id) }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-school-dark">Add PTA Committee Member</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Type *</label>
                <select
                  value={memberType}
                  onChange={(e) => { setMemberType(e.target.value as any); setSelectedId('') }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select {memberType === 'teacher' ? 'Teacher' : 'Parent'} *
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  <option value="">Select {memberType}</option>
                  {memberType === 'teacher'
                    ? teachers?.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.full_name} — {t.email}</option>
                      ))
                    : students?.map((s: any) => (
                        <option key={s.parent_email} value={s.parent_email}>
                          Parent of {s.full_name} — {s.parent_email}
                        </option>
                      ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position (optional)</label>
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="e.g. Chairman, Secretary"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAdd}
                  disabled={addMutation.isPending}
                  className="flex-1 bg-school-dark text-white rounded-lg py-2.5 text-sm font-medium hover:bg-school-blue disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Adding...' : 'Add to Committee'}
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
