import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { TERMS, PASS_MARK } from '../../lib/constants'
import { FileText, Lock } from 'lucide-react'

export default function StudentReportCard() {
  const { user } = useAuth()
  const [selectedTerm, setSelectedTerm] = useState('First')
  const [selectedSession, setSelectedSession] = useState('2024/2025')

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

  const { data: access } = useQuery({
    queryKey: ['report-access-student', student?.id, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('report_card_access')
        .select('*')
        .eq('student_id', student?.id)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
        .single()
      return data
    },
    enabled: !!student?.id
  })

  const { data: grades } = useQuery({
    queryKey: ['grades-student', student?.id, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', student?.id)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
      return data ?? []
    },
    enabled: !!student?.id && access?.status === 'approved'
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
      return { percentage: total > 0 ? Math.round((present / total) * 100) : 0 }
    },
    enabled: !!student?.id
  })

  if (!student) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <p>Your student profile is not linked yet.</p>
        <p className="text-sm mt-1">Please contact the school admin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Term Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          >
            {TERMS.map(t => (
              <option key={t} value={t}>{t} Term</option>
            ))}
          </select>
          <input
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            placeholder="Session"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          />
        </div>
      </div>

      {access?.status !== 'approved' ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-school-dark mb-2">
            Report Card Locked
          </h3>
          <p className="text-gray-500 text-sm">
            Your report card for {selectedTerm} Term is not yet available.
            Please ask your parent to contact the school admin.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-school-dark text-white p-6 text-center">
            <h2 className="text-xl font-bold">Report Card</h2>
            <p className="text-blue-200 text-sm">{selectedTerm} Term — {selectedSession}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Name:</span> {student.full_name}</p>
                <p><span className="font-medium">Class:</span> {student.class}</p>
              </div>
              <div>
                {student.department && (
                  <p><span className="font-medium">Dept:</span> {student.department}</p>
                )}
                <p><span className="font-medium">Attendance:</span> {attendanceData?.percentage ?? 0}%</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-school-dark text-white">
                  <tr>
                    <th className="text-left p-3">Subject</th>
                    <th className="p-3 text-center">CA1</th>
                    <th className="p-3 text-center">CA2</th>
                    <th className="p-3 text-center">Exam</th>
                    <th className="p-3 text-center">Total</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-center">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {grades?.map((g: any) => (
                    <tr key={g.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{g.subject}</td>
                      <td className="p-3 text-center">{g.ca1}</td>
                      <td className="p-3 text-center">{g.ca2}</td>
                      <td className="p-3 text-center">{g.exam}</td>
                      <td className="p-3 text-center font-bold">{g.total}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${
                          g.grade_letter === 'A' ? 'text-green-600' :
                          g.grade_letter === 'F' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {g.grade_letter}
                        </span>
                      </td>
                      <td className="p-3 text-center text-xs">{g.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {grades && grades.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium">Average: {
                  Math.round(grades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / grades.length)
                }%</p>
                <p className="font-medium">Result: {
                  Math.round(grades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / grades.length) >= PASS_MARK
                    ? '✅ PASSED' : '❌ FAILED'
                }</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
