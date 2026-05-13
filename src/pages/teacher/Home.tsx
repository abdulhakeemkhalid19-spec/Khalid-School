import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Users, BookOpen, ClipboardList } from 'lucide-react'

export default function TeacherHome() {
  const { user } = useAuth()

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

  const { data: students } = useQuery({
    queryKey: ['teacher-students', teacher?.assigned_class],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('class', teacher?.assigned_class)
      return data ?? []
    },
    enabled: !!teacher?.assigned_class
  })

  const { data: notices } = useQuery({
    queryKey: ['notices-teacher'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      return data ?? []
    }
  })

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-school-dark text-white rounded-xl p-6">
        <h2 className="text-xl font-bold mb-1">
          Welcome, {teacher?.full_name ?? user?.email}!
        </h2>
        <p className="text-blue-200 text-sm">
          {teacher?.type === 'primary'
            ? `Form Teacher — ${teacher?.assigned_class}`
            : `Subject Teacher — ${teacher?.subject}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
            <Users size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-school-dark">
            {students?.length ?? 0}
          </p>
          <p className="text-sm text-gray-500">My Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
            <BookOpen size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-school-dark">
            {teacher?.type === 'primary' ? 'All Subjects' : teacher?.subject ?? '—'}
          </p>
          <p className="text-sm text-gray-500">Teaching</p>
        </div>
      </div>

      {/* Recent Notices */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-school-dark mb-4">Recent Notices</h3>
        {notices?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No notices yet</p>
        ) : (
          <div className="space-y-3">
            {notices?.map((notice: any) => (
              <div key={notice.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm">{notice.title}</p>
                <p className="text-xs text-gray-500 mt-1">{notice.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notice.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
