import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES, TERMS, SCHOOL_NAME, SCHOOL_LOCATION, PASS_MARK, SCHOOL_LOGO } from '../../lib/constants'
import { FileText, Download } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportCards() {
  const qc = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('First')
  const [selectedSession, setSelectedSession] = useState('2024/2025')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [teacherRemark, setTeacherRemark] = useState('')
  const [principalRemark, setPrincipalRemark] = useState('')

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

  const { data: grades } = useQuery({
    queryKey: ['grades', selectedStudent?.id, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
      return data ?? []
    },
    enabled: !!selectedStudent
  })

  const { data: remarks } = useQuery({
    queryKey: ['remarks', selectedStudent?.id, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('report_remarks')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
        .single()
      if (data) {
        setTeacherRemark(data.teacher_remark ?? '')
        setPrincipalRemark(data.principal_remark ?? '')
      }
      return data
    },
    enabled: !!selectedStudent
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-summary', selectedStudent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', selectedStudent.id)
      const total = data?.length ?? 0
      const present = data?.filter((a: any) => a.status === 'present').length ?? 0
      return { total, present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 }
    },
    enabled: !!selectedStudent
  })

  const saveRemarksMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('report_remarks')
        .upsert({
          student_id: selectedStudent.id,
          term: selectedTerm,
          session: selectedSession,
          teacher_remark: teacherRemark,
          principal_remark: principalRemark,
        }, { onConflict: 'student_id,term,session' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['remarks'] })
      toast.success('Remarks saved!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const generatePDF = () => {
    if (!selectedStudent || !grades) {
      toast.error('Please select a student')
      return
    }

    const doc = new jsPDF()

    // Header
    doc.setFillColor(10, 22, 40)
    doc.rect(0, 0, 210, 45, 'F')

    // Logo
    if (SCHOOL_LOGO) {
      doc.addImage(SCHOOL_LOGO, 'PNG', 10, 5, 35, 35)
    }

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(SCHOOL_NAME, 105, 15, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(SCHOOL_LOCATION, 105, 23, { align: 'center' })
    doc.text('STUDENT REPORT CARD', 105, 33, { align: 'center' })

    // Student Info
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${selectedStudent.full_name}`, 14, 55)
    doc.text(`Class: ${selectedStudent.class}`, 14, 62)
    doc.text(`Term: ${selectedTerm} Term`, 14, 69)
    doc.text(`Session: ${selectedSession}`, 14, 76)
    doc.text(`Gender: ${selectedStudent.gender}`, 110, 55)
    if (selectedStudent.department) {
      doc.text(`Department: ${selectedStudent.department}`, 110, 62)
    }
    doc.text(`Attendance: ${attendanceData?.percentage ?? 0}%`, 110, 69)

    // Grades Table
    const tableData = grades.map((g: any) => [
      g.subject,
      g.ca1 ?? 0,
      g.ca2 ?? 0,
      g.exam ?? 0,
      g.total ?? 0,
      g.grade_letter ?? '',
      g.remark ?? '',
    ])

    autoTable(doc, {
      startY: 85,
      head: [['Subject', 'CA1', 'CA2', 'Exam', 'Total', 'Grade', 'Remark']],
      body: tableData,
      headStyles: { fillColor: [10, 22, 40], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [232, 240, 254] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10

    // Average & Result
    const totalScore = grades.reduce((sum: number, g: any) => sum + (g.total ?? 0), 0)
    const avg = grades.length > 0 ? Math.round(totalScore / grades.length) : 0
    const passed = avg >= PASS_MARK

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Average Score: ${avg}%`, 14, finalY)
    doc.text(`Result: ${passed ? 'PASSED' : 'FAILED'}`, 14, finalY + 7)

    // Remarks
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text("Class Teacher's Remark:", 14, finalY + 20)
    doc.setFont('helvetica', 'normal')
    doc.text(teacherRemark || '________________________________', 14, finalY + 28)

    doc.setFont('helvetica', 'bold')
    doc.text("Principal's Remark:", 110, finalY + 20)
    doc.setFont('helvetica', 'normal')
    doc.text(principalRemark || '________________________________', 110, finalY + 28)

    // Signature lines
    doc.setFont('helvetica', 'bold')
    doc.text("Class Teacher's Signature:", 14, finalY + 42)
    doc.line(14, finalY + 50, 90, finalY + 50)

    doc.text("Principal's Signature:", 110, finalY + 42)
    doc.line(110, finalY + 50, 190, finalY + 50)

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' })
    doc.text(SCHOOL_NAME, 105, 290, { align: 'center' })

    doc.save(`${selectedStudent.full_name}_${selectedTerm}_Term_Report.pdf`)
    toast.success('Report card downloaded!')
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(null) }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          >
            <option value="">Select Class</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
          <button
            onClick={generatePDF}
            className="flex items-center justify-center gap-2 bg-school-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-blue"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Students List */}
      {selectedClass && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-school-dark">
              Select Student — {selectedClass}
            </h3>
          </div>
          <div className="divide-y">
            {students?.map((student: any) => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedStudent?.id === student.id
                    ? 'bg-blue-50 border-l-4 border-school-dark'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-school-dark rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {student.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{student.full_name}</p>
                    <p className="text-xs text-gray-500">{student.class}</p>
                  </div>
                </div>
                <FileText size={16} className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Card Preview */}
      {selectedStudent && grades && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-school-dark text-white p-6 text-center">
            <h2 className="text-xl font-bold">{SCHOOL_NAME}</h2>
            <p className="text-blue-200 text-sm">{SCHOOL_LOCATION}</p>
            <p className="font-medium mt-1">STUDENT REPORT CARD</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
              <div>
                <p><span className="font-medium">Name:</span> {selectedStudent.full_name}</p>
                <p><span className="font-medium">Class:</span> {selectedStudent.class}</p>
                <p><span className="font-medium">Term:</span> {selectedTerm} Term</p>
                <p><span className="font-medium">Session:</span> {selectedSession}</p>
              </div>
              <div>
                <p><span className="font-medium">Gender:</span> {selectedStudent.gender}</p>
                {selectedStudent.department && (
                  <p><span className="font-medium">Dept:</span> {selectedStudent.department}</p>
                )}
                <p><span className="font-medium">Attendance:</span> {attendanceData?.percentage ?? 0}%</p>
              </div>
            </div>

            {/* Grades Table */}
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
                  {grades.map((g: any) => (
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

            {/* Average */}
            {grades.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Average: {
                      Math.round(grades.reduce((s: number, g: any) =>
                        s + (g.total ?? 0), 0) / grades.length)
                    }%</p>
                    <p className="font-medium">Result: {
                      Math.round(grades.reduce((s: number, g: any) =>
                        s + (g.total ?? 0), 0) / grades.length) >= PASS_MARK
                        ? '✅ PASSED' : '❌ FAILED'
                    }</p>
                  </div>
                </div>
              </div>
            )}

            {/* Remarks Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Teacher's Remark
                </label>
                <textarea
                  value={teacherRemark}
                  onChange={(e) => setTeacherRemark(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Enter class teacher's remark..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Principal's Remark
                </label>
                <textarea
                  value={principalRemark}
                  onChange={(e) => setPrincipalRemark(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Enter principal's remark..."
                  rows={3}
                />
              </div>
            </div>

            {/* Save Remarks & Download */}
            <div className="flex gap-3">
              <button
                onClick={() => saveRemarksMutation.mutate()}
                disabled={saveRemarksMutation.isPending}
                className="flex-1 bg-school-dark text-white rounded-lg py-2.5 text-sm font-medium hover:bg-school-blue disabled:opacity-50"
              >
                {saveRemarksMutation.isPending ? 'Saving...' : 'Save Remarks'}
              </button>
              <button
                onClick={generatePDF}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-600"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
          }
