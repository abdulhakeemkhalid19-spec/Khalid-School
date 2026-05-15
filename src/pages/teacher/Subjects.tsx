import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

export default function TeacherSubjects() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [newSubject, setNewSubject] = useState('')

  const { data: teacher } = useQuery({
    queryKey: ['teacher-profile', user?.id],
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

  const { data: subjects } = useQuery({
    queryKey: ['teacher-subjects', teacher?.assigned_class],
    queryFn: async () => {
      const { data } = await supabase
        .from('class_subjects')
        .select('*')
        .eq('class', teacher?.assigned_class)
        .order('subject')
      return data ?? []
    },
    enabled: !!teacher?.assigned_class
  })

  const addMutation = useMutation({
    mutationFn: async (subject: string) => {
      const { error } = await supabase
        .from('class_subjects')
        .insert({
          class: teacher?.assigned_class,
          subject,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-subjects'] })
      toast.success('Subject added!')
      setNewSubject('')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('class_subjects')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-subjects'] })
      toast.success('Subject deleted!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleAdd = () => {
    if (!newSubject.trim()) {
      toast.error('Please enter a subject name')
      return
    }
    addMutation.mutate(newSubject.trim())
  }

  if (!teacher?.assigned_class) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <BookOpen size={40} className="mx-auto mb-2 opacity-50" />
        <p>You are not assigned to any class yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Class Info */}
      <div className="bg-school-dark text-white rounded-xl p-4">
        <p className="font-semibold">
          Managing subjects for: {teacher?.assigned_class}
        </p>
      </div>

      {/* Add Subject */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-school-dark mb-3">Add New Subject</h3>
        <div className="flex gap-3">
          <input
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="flex items-center gap-2 bg-school-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-blue disabled:opacity-50"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Subjects List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-school-dark">
            Subjects — {subjects?.length ?? 0} total
          </h3>
        </div>
        {subjects?.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p>No subjects added yet</p>
            <p className="text-sm mt-1">Add subjects above</p>
          </div>
        ) : (
          <div className="divide-y">
            {subjects?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen size={16} className="text-blue-600" />
                  </div>
                  <p className="font-medium text-sm">{s.subject}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this subject?')) {
                      deleteMutation.mutate(s.id)
                    }
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
        }
