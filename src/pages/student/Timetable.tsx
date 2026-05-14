import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Clock } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7']

export default function StudentTimetable() {
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

  const { data: timetable } = useQuery({
    queryKey: ['timetable', student?.class],
    queryFn: async () => {
      const { data } = await supabase
        .from('timetable')
        .select('*')
        .eq('class', student?.class)
      const map: Record<string, string> = {}
      data?.forEach((t: any) => {
        map[`${t.day}-${t.period}`] = t.subject
      })
      return map
    },
    enabled: !!student?.class
  })

  if (!student) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <Clock size={40} className="mx-auto mb-2 opacity-50" />
        <p>Your profile is not linked yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-school-dark text-white rounded-xl p-4">
        <p className="font-semibold">{student.class} — Weekly Timetable</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-school-dark text-white">
              <tr>
                <th className="text-left p-3">Period</th>
                {DAYS.map(day => (
                  <th key={day} className="p-3 text-center min-w-[100px]">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, idx) => (
                <tr key={period} className={`border-b ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <td className="p-3 font-medium text-school-dark">{period}</td>
                  {DAYS.map(day => (
                    <td key={day} className="p-3 text-center">
                      {timetable?.[`${day}-${period}`] ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                          {timetable[`${day}-${period}`]}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
