import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES } from '../../lib/constants'
import { Save, Calendar } from 'lucide-react'
import { toast } from 'sonner'

type AttendanceStatus = 'present' | 'absent' | 'late'

export default function Attendance() {
  const qc = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

  const { data: students } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: async () => {
      let query = supabase.from('students').select('*').order('full_name')
      if (selectedClass) query = query.eq('class', selectedClass)
      const { data } = await query
      return data ?? []
    },
    enabled: !!selectedClass
  })

  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('class', selectedClass)
        .eq('date', selectedDate)
      const map: Record<string, AttendanceStatus> = {}
      data?.forEach((a: any) => {
        map[a.student_id] = a.status
      })
      setAttendance(map)
      return data ?? []
    },
    enabled: !!selectedClass && !!selectedDate
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(attendance).map(([student_id, status]) => ({
        student_id,
        status,
        date: selectedDate,
        class: selectedClass,
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
    students?.forEach((s: any) => {
      map[s.id] = status
    })
    setAttendance(map)
  }

  const statusColor = (status: AttendanceStatus) => {
    if (status === 'present') return 'bg-green-500 text-white'
    if (status === 'absent') return 'bg-red-500 text-white'
    if (status === 'late') return 'bg-yellow-500 text-white'
    return 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          >
            <option value="">Select Class</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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

      {!selectedClass ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          <Calendar size={40} className="mx-auto mb-2 opacity-50" />
          <p>Select a class to mark attendance</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-school-dark">
              {selectedClass} — {new Date(selectedDate).toDateString()}
            </h3>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                Late
              </span>
            </div>
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
                          ? statusColor(status)
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
      )}
    </div>
  )
}
