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

  const { data: classSubjects } = useQuery({
    queryKey: ['class-subjects', teacher?.assigned_class],
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
      qc.invalidateQueries({ queryKey: ['class-subjects'] })
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
      qc.invalidateQueries({ queryKey: ['class-subjects'] })
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

  if (!teacher) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <p>Loading...</p>
      </div>
    )
  }

  const isPrimary = teacher?.type === 'primary'
  const isSecondary = teacher?.type === 'secondary'
  const isBoth = isPrimary && teacher?.is_also_subject_teacher

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-school-dark text-white rounded-xl p-4 space-y-1">
        {isPrimary && (
          <p className="font-semibold">
            Form Teacher — {teacher?.assigned_class}
          </p>
        )}
        {(isSecondary || isBoth) && (
          <p className="font-semibold">
            Subject Teacher — {teacher?.subject ?? teacher?.secondary_subject}
          </p>
        )}
        <p className="text-blue-200 text-sm">
          {isPrimary && !isBoth && 'You manage all subjects for your class'}
          {isSecondary && !isBoth && 'You teach your subject across all classes'}
          {isBoth && 'You are both a form teacher and subject teacher'}
        </p>
      </div>

      {/* Class Subjects — for primary and both */}
      {(isPrimary) && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-school-dark mb-3">
            Add Subject for {teacher?.assigned_class}
          </h3>
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
      )}

      {/* Class Subjects List */}
      {isPrimary && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-school-dark">
              {teacher?.assigned_class} Subjects — {classSubjects?.length ?? 0} total
            </h3>
          </div>
          {classSubjects?.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
              <p>No subjects added yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {classSubjects?.map((s: any) => (
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
      )}

      {/* Secondary Subject */}
      {(isSecondary || isBoth) && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-school-dark">Your Subject</h3>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {teacher?.subject ?? teacher?.secondary_subject ?? 'No subject assigned'}
              </p>
              <p className="text-xs text-gray-500">Teaching across all classes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
