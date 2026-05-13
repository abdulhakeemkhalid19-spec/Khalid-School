import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Save, Calendar } from 'lucide-react'
import { toast } from 'sonner'

type AttendanceStatus = 'present' | 'absent' | 'late'

export default function TeacherAttendance() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

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
        .order('full_name')
      return data ?? []
    },
    enabled: !!teacher?.assigned_class
  })

  useQuery({
    queryKey: ['attendance', teacher?.assigned_class, selectedDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('class', teacher?.assigned_class)
        .eq('date', selectedDate)
      const map: Record<string, AttendanceStatus> = {}
      data?.forEach((a: any) => {
        map[a.student_id] = a.status
      })
      setAttendance(map)
      return data ?? []
    },
    enabled: !!teacher?.assigned_class && !!selectedDate
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id,
        status,
        date: selectedDate,
        class: teacher?.assigned_class,
      }))
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,date' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance saved!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {}
    students?.forEach((s: any) => { map[s.id] = status })
    setAttendance(map)
  }

  if (!teacher?.assigned_class) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <p>You are not assigned to any class yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
          <div className="flex gap-2">
            <button
              onClick={() => markAll('present')}
              className="flex-1 bg-green-500 text-white rounded-lg py-2 text-xs font-medium hover:bg-green-600"
            >
              All Present
            </button>
            <button
              onClick={() => markAll('absent')}
              className="flex-1 bg-red-500 text-white rounded-lg py-2 text-xs font-medium hover:bg-red-600"
            >
              All Absent
            </button>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center justify-center gap-2 bg-school-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-blue disabled:opacity-50"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-school-dark">
            {teacher?.assigned_class} — {new Date(selectedDate).toDateString()}
          </h3>
        </div>
        <div className="divide-y">
          {students?.map((student: any, idx: number) => (
            <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-6">{idx + 1}</span>
                <div className="w-9 h-9 bg-school-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {student.full_name?.charAt(0)}
                </div>
                <p className="font-medium text-sm">{student.full_name}</p>
              </div>
              <div className="flex gap-2">
                {(['present', 'absent', 'late'] as AttendanceStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => setAttendance({ ...attendance, [student.id]: status })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      attendance[student.id] === status
                        ? status === 'present' ? 'bg-green-500 text-white'
                          : status === 'absent' ? 'bg-red-500 text-white'
                          : 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
