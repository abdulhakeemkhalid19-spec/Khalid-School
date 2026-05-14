import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { BookOpen, ClipboardList, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StudentHome() {
  const { user } = useAuth()

  const { data: student } = useQuery({
    queryKey: ['student-profile', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('student_email', user?.email)
        .single()
      return data
    },
    enabled: !!user
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-student', student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student?.id)
      const total = data?.length ?? 0
      const present = data?.filter((a: any) => a.status === 'present').length ?? 0
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0
      return { total, present, percentage }
    },
    enabled: !!student?.id
  })

  const { data: notices } = useQuery({
    queryKey: ['notices-student'],
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
      {student && (
        <div className="bg-school-dark text-white rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold">
              {student.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome, {student.full_name}!</h2>
              <p className="text-blue-200">{student.class} {student.department ? `• ${student.department}` : ''}</p>
              <p className="text-blue-300 text-sm">{student.gender}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/report-card" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
            <BookOpen size={20} className="text-white" />
          </div>
          <p className="font-bold text-school-dark">Report Card</p>
          <p className="text-sm text-gray-500">View grades</p>
        </Link>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
            <ClipboardList size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-school-dark">
            {attendanceData?.percentage ?? 0}%
          </p>
          <p className="text-sm text-gray-500">Attendance</p>
        </div>
      </div>

      {/* Notices */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-school-dark mb-4 flex items-center gap-2">
          <Bell size={18} />
          School Notices
        </h3>
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
