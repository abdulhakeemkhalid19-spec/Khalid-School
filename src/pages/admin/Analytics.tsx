import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES } from '../../lib/constants'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, Users, Award } from 'lucide-react'

const COLORS = ['#0A1628', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export default function Analytics() {
  const { data: students } = useQuery({
    queryKey: ['students-analytics'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
      return data ?? []
    }
  })

  const { data: grades } = useQuery({
    queryKey: ['grades-analytics'],
    queryFn: async () => {
      const { data } = await supabase
        .from('grades')
        .select('*')
      return data ?? []
    }
  })

  const { data: attendance } = useQuery({
    queryKey: ['attendance-analytics'],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
      return data ?? []
    }
  })

  // Students per class
  const studentsPerClass = CLASSES.map(cls => ({
    class: cls,
    count: students?.filter((s: any) => s.class === cls).length ?? 0
  })).filter(c => c.count > 0)

  // Average grades per class
  const avgPerClass = CLASSES.map(cls => {
    const classStudents = students?.filter((s: any) => s.class === cls) ?? []
    const classStudentIds = classStudents.map((s: any) => s.id)
    const classGrades = grades?.filter((g: any) =>
      classStudentIds.includes(g.student_id)
    ) ?? []
    const avg = classGrades.length > 0
      ? Math.round(classGrades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / classGrades.length)
      : 0
    return { class: cls, average: avg }
  }).filter(c => c.average > 0)

  // Attendance stats
  const totalAttendance = attendance?.length ?? 0
  const presentCount = attendance?.filter((a: any) => a.status === 'present').length ?? 0
  const absentCount = attendance?.filter((a: any) => a.status === 'absent').length ?? 0
  const lateCount = attendance?.filter((a: any) => a.status === 'late').length ?? 0

  const attendancePieData = [
    { name: 'Present', value: presentCount },
    { name: 'Absent', value: absentCount },
    { name: 'Late', value: lateCount },
  ].filter(d => d.value > 0)

  // Gender distribution
  const maleCount = students?.filter((s: any) => s.gender === 'Male').length ?? 0
  const femaleCount = students?.filter((s: any) => s.gender === 'Female').length ?? 0
  const genderData = [
    { name: 'Male', value: maleCount },
    { name: 'Female', value: femaleCount },
  ]

  const totalStudents = students?.length ?? 0
  const avgAttendance = totalAttendance > 0
    ? Math.round((presentCount / totalAttendance) * 100)
    : 0
  const overallAvg = grades && grades.length > 0
    ? Math.round(grades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / grades.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <Users size={24} className="mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold text-school-dark">{totalStudents}</p>
          <p className="text-sm text-gray-500">Total Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <TrendingUp size={24} className="mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold text-school-dark">{avgAttendance}%</p>
          <p className="text-sm text-gray-500">Avg Attendance</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <Award size={24} className="mx-auto mb-2 text-yellow-500" />
          <p className="text-2xl font-bold text-school-dark">{overallAvg}%</p>
          <p className="text-sm text-gray-500">Avg Performance</p>
        </div>
      </div>

      {/* Students Per Class */}
      {studentsPerClass.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-school-dark mb-4">Students Per Class</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={studentsPerClass}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0A1628" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Average Performance Per Class */}
      {avgPerClass.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-school-dark mb-4">Average Performance Per Class</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={avgPerClass}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="average" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Pie */}
        {attendancePieData.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-school-dark mb-4">Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {attendancePieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-school-dark mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {genderData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
