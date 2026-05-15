import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Search, Link, Unlink, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function LinkParents() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedParent, setSelectedParent] = useState<any>(null)
  const [studentSearch, setStudentSearch] = useState('')

  const { data: parents } = useQuery({
    queryKey: ['parent-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'parent')
      return data ?? []
    }
  })

  const { data: students } = useQuery({
    queryKey: ['all-students-link'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('full_name')
      return data ?? []
    }
  })

  const linkMutation = useMutation({
    mutationFn: async ({ parentEmail, studentId }: { parentEmail: string, studentId: string }) => {
      const { error } = await supabase
        .from('students')
        .update({ parent_email: parentEmail })
        .eq('id', studentId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-students-link'] })
      toast.success('Parent linked to student!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const unlinkMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ parent_email: null })
        .eq('id', studentId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-students-link'] })
      toast.success('Parent unlinked!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const filteredParents = parents?.filter((p: any) =>
    p.user_id?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredStudents = students?.filter((s: any) =>
    s.full_name?.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const linkedStudents = students?.filter((s: any) =>
    selectedParent && s.parent_email
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parents List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-school-dark text-white">
            <h3 className="font-semibold">Select Parent</h3>
          </div>
          <div className="p-3 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parents..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
              />
            </div>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {filteredParents?.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>No parents found</p>
              </div>
            ) : (
              filteredParents?.map((parent: any) => (
                <div
                  key={parent.id}
                  onClick={() => setSelectedParent(parent)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${
                    selectedParent?.id === parent.id ? 'bg-blue-50 border-l-4 border-school-dark' : ''
                  }`}
                >
                  <p className="text-sm font-medium">
                    {parent.user_id?.substring(0, 20)}...
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{parent.role}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-school-dark text-white">
            <h3 className="font-semibold">
              {selectedParent ? 'Link Student to Parent' : 'Select a parent first'}
            </h3>
          </div>
          <div className="p-3 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                disabled={!selectedParent}
              />
            </div>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {!selectedParent ? (
              <div className="p-8 text-center text-gray-400">
                <p>Select a parent to link students</p>
              </div>
            ) : filteredStudents?.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No students found</p>
              </div>
            ) : (
              filteredStudents?.map((student: any) => (
                <div key={student.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium">{student.full_name}</p>
                    <p className="text-xs text-gray-500">{student.class}</p>
                    {student.parent_email && (
                      <p className="text-xs text-green-600">
                        Linked: {student.parent_email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => linkMutation.mutate({
                        parentEmail: selectedParent.user_id,
                        studentId: student.id
                      })}
                      disabled={linkMutation.isPending}
                      className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                    >
                      <Link size={12} />
                      Link
                    </button>
                    {student.parent_email && (
                      <button
                        onClick={() => unlinkMutation.mutate(student.id)}
                        disabled={unlinkMutation.isPending}
                        className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
                      >
                        <Unlink size={12} />
                        Unlink
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Currently Linked */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-school-dark">All Linked Students</h3>
        </div>
        <div className="divide-y">
          {students?.filter((s: any) => s.parent_email)?.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No students linked to parents yet</p>
            </div>
          ) : (
            students?.filter((s: any) => s.parent_email)?.map((student: any) => (
              <div key={student.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{student.full_name}</p>
                  <p className="text-xs text-gray-500">{student.class}</p>
                  <p className="text-xs text-green-600">Parent: {student.parent_email}</p>
                </div>
                <button
                  onClick={() => unlinkMutation.mutate(student.id)}
                  className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  <Unlink size={12} />
                  Unlink
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
    }
