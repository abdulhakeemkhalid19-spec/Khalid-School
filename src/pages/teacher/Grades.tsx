import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { TERMS, GRADES } from '../../lib/constants'
import { Save, Search } from 'lucide-react'
import { toast } from 'sonner'

function getGrade(total: number) {
  const grade = GRADES.find(g => total >= g.min && total <= g.max)
  return grade ?? { letter: 'F', remark: 'Fail' }
}

export default function TeacherGrades() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedTerm, setSelectedTerm] = useState('First')
  const [selectedSession, setSelectedSession] = useState('2024/2025')
  const [search, setSearch] = useState('')
  const [editingGrades, setEditingGrades] = useState<Record<string, any>>({})

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

  const { data: grades } = useQuery({
    queryKey: ['grades', teacher?.assigned_class, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('grades')
        .select('*')
        .eq('class', teacher?.assigned_class)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
      return data ?? []
    },
    enabled: !!teacher?.assigned_class
  })

  const saveMutation = useMutation({
    mutationFn: async (gradeData: any) => {
      const { error } = await supabase
        .from('grades')
        .upsert(gradeData, { onConflict: 'student_id,subject,term,session' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] })
      toast.success('Grades saved!')
      setEditingGrades({})
    },
    onError: (e: any) => toast.error(e.message)
  })

  const subjects = teacher?.type === 'primary'
    ? ['English', 'Mathematics', 'Basic Science', 'Social Studies',
       'Civic Education', 'Agricultural Science', 'French', 'Islamic Studies']
    : [teacher?.subject ?? '']

  const filtered = students?.filter((s: any) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getStudentGrade = (studentId: string, subject: string) => {
    return grades?.find((g: any) =>
      g.student_id === studentId && g.subject === subject
    )
  }

  const updateGrade = (studentId: string, subject: string, field: string, value: string) => {
    const key = `${studentId}-${subject}`
    const existing = editingGrades[key] ?? getStudentGrade(studentId, subject) ?? {}
    setEditingGrades({
      ...editingGrades,
      [key]: { ...existing, [field]: Number(value) }
    })
  }

  const saveGrades = () => {
    const toSave = Object.entries(editingGrades).map(([key, data]: any) => {
      const [studentId, ...subjectParts] = key.split('-')
      const subject = subjectParts.join('-')
      const ca1 = data.ca1 ?? 0
      const ca2 = data.ca2 ?? 0
      const exam = data.exam ?? 0
      const total = ca1 + ca2 + exam
      const grade = getGrade(total)
      return {
        student_id: studentId,
        subject,
        term: selectedTerm,
        session: selectedSession,
        class: teacher?.assigned_class,
        ca1, ca2, exam, total,
        grade_letter: grade.letter,
        remark: grade.remark,
      }
    })
    if (toSave.length === 0) {
      toast.error('No changes to save')
      return
    }
    saveMutation.mutate(toSave)
  }

  if (!teacher) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <p>Loading teacher profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
            />
          </div>
          <button
            onClick={saveGrades}
            disabled={saveMutation.isPending}
            className="flex items-center justify-center gap-2 bg-school-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-blue disabled:opacity-50"
          >
            <Save size={16} />
            Save Grades
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-school-dark text-white">
              <tr>
                <th className="text-left p-3 sticky left-0 bg-school-dark">Student</th>
                {subjects.map(s => (
                  <th key={s} className="p-3 text-center min-w-[140px]">
                    <div>{s}</div>
                    <div className="text-xs font-normal text-blue-200 flex gap-1 justify-center mt-1">
                      <span>CA1</span>
                      <span>CA2</span>
                      <span>Exam</span>
                      <span>Total</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered?.map((student: any) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium sticky left-0 bg-white">
                    {student.full_name}
                  </td>
                  {subjects.map(subject => {
                    const key = `${student.id}-${subject}`
                    const existing = getStudentGrade(student.id, subject)
                    const editing = editingGrades[key]
                    const ca1 = editing?.ca1 ?? existing?.ca1 ?? ''
                    const ca2 = editing?.ca2 ?? existing?.ca2 ?? ''
                    const exam = editing?.exam ?? existing?.exam ?? ''
                    const total = Number(ca1 || 0) + Number(ca2 || 0) + Number(exam || 0)
                    const grade = total > 0 ? getGrade(total) : null
                    return (
                      <td key={subject} className="p-2">
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={ca1}
                            onChange={(e) => updateGrade(student.id, subject, 'ca1', e.target.value)}
                            className="w-10 border rounded px-1 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-school-dark"
                            placeholder="0"
                          />
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={ca2}
                            onChange={(e) => updateGrade(student.id, subject, 'ca2', e.target.value)}
                            className="w-10 border rounded px-1 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-school-dark"
                            placeholder="0"
                          />
                          <input
                            type="number"
                            min="0"
                            max="40"
                            value={exam}
                            onChange={(e) => updateGrade(student.id, subject, 'exam', e.target.value)}
                            className="w-10 border rounded px-1 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-school-dark"
                            placeholder="0"
                          />
                          <span className={`text-xs font-bold w-8 text-center ${
                            grade?.letter === 'A' ? 'text-green-600' :
                            grade?.letter === 'B' ? 'text-blue-600' :
                            grade?.letter === 'F' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {total > 0 ? total : '—'}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
