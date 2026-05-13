import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES, TERMS, SCHOOL_NAME, SCHOOL_LOCATION, PASS_MARK } from '../../lib/constants'
import { FileText, Download, Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportCards() {
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('First')
  const [selectedSession, setSelectedSession] = useState('2024/2025')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

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

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-summary', selectedStudent?.id, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', selectedStudent.id)
      const total = data?.length ?? 0
      const present = data?.filter((a: any) => a.status === 'present').length ?? 0
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0
      return { total, present, percentage }
    },
    enabled: !!selectedStudent
  })

  const generatePDF = () => {
    if (!selectedStudent || !grades) {
      toast.error('Please select a student')
      return
    }

    const doc = new jsPDF()

    // Header
    doc.setFillColor(10, 22, 40)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(SCHOOL_NAME, 105, 15, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(SCHOOL_LOCATION, 105, 23, { align: 'center' })
    doc.text('STUDENT REPORT CARD', 105, 32, { align: 'center' })

    // Student Info
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('STUDENT INFORMATION', 14, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Name: ${selectedStudent.full_name}`, 14, 58)
    doc.text(`Class: ${selectedStudent.class}`, 14, 64)
    doc.text(`Term: ${selectedTerm} Term`, 14, 70)
    doc.text(`Session: ${selectedSession}`, 14, 76)
    doc.text(`Gender: ${selectedStudent.gender}`, 110, 58)
    if (selectedStudent.department) {
      doc.text(`Department: ${selectedStudent.department}`, 110, 64)
    }
    doc.text(`Attendance: ${attendanceData?.percentage ?? 0}%`, 110, 70)

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
      headStyles: {
        fillColor: [10, 22, 40],
        textColor: 255,
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [232, 240, 254] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10

    // Average & Position
    const totalScore = grades.reduce((sum: number, g: any) => sum + (g.total ?? 0), 0)
    const avg = grades.length > 0 ? Math.round(totalScore / grades.length) : 0
    const passed = avg >= PASS_MARK

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Average Score: ${avg}%`, 14, finalY)
    doc.text(`Result: ${passed ? 'PASSED' : 'FAILED'}`, 14, finalY + 7)

    // Remarks
    doc.text('Class Teacher Remark:', 14, finalY + 20)
    doc.setFont('helvetica', 'normal')
    doc.text('_______________________________', 14, finalY + 28)
    doc.setFont('helvetica', 'bold')
    doc.text("Principal's Remark:", 110, finalY + 20)
    doc.setFont('helvetica', 'normal')
    doc.text('_______________________________', 110, finalY + 28)

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
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
                  selectedStudent?.id === student.id ? 'bg-blue-50 border-l-4 border-school-dark' : ''
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

      {/* Preview */}
      {selectedStudent && grades && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-school-dark text-white p-6 text-center">
            <h2 className="text-xl font-bold">{SCHOOL_NAME}</h2>
            <p className="text-blue-200 text-sm">{SCHOOL_LOCATION}</p>
            <p className="text-white mt-1 font-medium">STUDENT REPORT CARD</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Name:</span> {selectedStudent.full_name}</p>
                <p><span className="font-medium">Class:</span> {selectedStudent.class}</p>
                <p><span className="font-medium">Term:</span> {selectedTerm} Term</p>
              </div>
              <div>
                <p><span className="font-medium">Gender:</span> {selectedStudent.gender}</p>
                {selectedStudent.department && (
                  <p><span className="font-medium">Department:</span> {selectedStudent.department}</p>
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
                          g.grade_letter === 'B' ? 'text-blue-600' :
                          g.grade_letter === 'F' ? 'text-red-600' : 'text-yellow-600'
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

            {grades.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">Average Score: {
                      Math.round(grades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / grades.length)
                    }%</p>
                    <p className="font-medium">Result: {
                      Math.round(grades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / grades.length) >= PASS_MARK
                        ? '✅ PASSED' : '❌ FAILED'
                    }</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
