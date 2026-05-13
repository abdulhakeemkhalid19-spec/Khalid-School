import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Users, GraduationCap, Bell, TrendingUp, UserPlus, FileText, Send } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminHome() {
  const { data: studentCount } = useQuery({
    queryKey: ['student-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
      return count ?? 0
    }
  })

  const { data: teacherCount } = useQuery({
    queryKey: ['teacher-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
      return count ?? 0
    }
  })

  const { data: noticeCount } = useQuery({
    queryKey: ['notice-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
      return count ?? 0
    }
  })

  const { data: recentStudents } = useQuery({
    queryKey: ['recent-students'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      return data ?? []
    }
  })

  const stats = [
    {
      label: 'Total Students',
      value: studentCount ?? 0,
      icon: Users,
      color: 'bg-blue-500',
      to: '/students'
    },
    {
      label: 'Total Teachers',
      value: teacherCount ?? 0,
      icon: GraduationCap,
      color: 'bg-green-500',
      to: '/teachers'
    },
    {
      label: 'Notices Sent',
      value: noticeCount ?? 0,
      icon: Bell,
      color: 'bg-purple-500',
      to: '/notices'
    },
    {
      label: 'Avg Performance',
      value: '72%',
      icon: TrendingUp,
      color: 'bg-orange-500',
      to: '/analytics'
    },
  ]

  const quickActions = [
    { label: 'Add Student', icon: UserPlus, to: '/students', color: 'bg-blue-500' },
    { label: 'Report Cards', icon: FileText, to: '/report-cards', color: 'bg-green-500' },
    { label: 'Send Notice', icon: Send, to: '/notices', color: 'bg-purple-500' },
    { label: 'View Analytics', icon: TrendingUp, to: '/analytics', color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-school-dark">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-school-dark mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}
            >
              <action.icon size={24} />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-school-dark mb-4">Recent Students</h2>
        {recentStudents?.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users size={40} className="mx-auto mb-2 opacity-50" />
            <p>No students yet</p>
            <Link to="/students" className="text-blue-500 text-sm hover:underline">
              Add your first student
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentStudents?.map((student: any) => (
              <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 bg-school-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {student.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm text-school-dark">{student.full_name}</p>
                  <p className="text-xs text-gray-500">{student.class} {student.department ? `• ${student.department}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
