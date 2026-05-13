import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { TERMS, SCHOOL_NAME, SCHOOL_LOCATION, BANK_DETAILS, PASS_MARK } from '../../lib/constants'
import { Lock, Bell, Download } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ParentReportCard() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedTerm, setSelectedTerm] = useState('First')
  const [selectedSession, setSelectedSession] = useState('2024/2025')

  const { data: child } = useQuery({
    queryKey: ['parent-child', user?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('parent_email', user?.email)
        .single()
      return data
    },
    enabled: !!user
  })

  const { data: access } = useQuery({
    queryKey: ['report-access', child?.id, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('report_card_access')
        .select('*')
        .eq('student_id', child?.id)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
        .single()
      return data
    },
    enabled: !!child?.id
  })

  const { data: grades } = useQuery({
    queryKey: ['grades-parent', child?.id, selectedTerm, selectedSession],
    queryFn: async () => {
      const { data } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', child?.id)
        .eq('term', selectedTerm)
        .eq('session', selectedSession)
      return data ?? []
    },
    enabled: !!child?.id && access?.status === 'approved'
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-parent', child?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', child?.id)
      const total = data?.length ?? 0
      const present = data?.filter((a: any) => a.status === 'present').length ?? 0
      return { total, present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 }
    },
    enabled: !!child?.id
  })

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('report_card_access')
        .upsert({
          student_id: child?.id,
          parent_email: user?.email,
          term: selectedTerm,
          session: selectedSession,
          status: 'pending',
        }, { onConflict: 'student_id,term,session' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-access'] })
      toast.success('Admin has been notified!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const generatePDF = () => {
    if (!child || !grades) return
    const doc = new jsPDF()
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
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${child.full_name}`, 14, 50)
    doc.text(`Class: ${child.class}`, 14, 57)
    doc.text(`Term: ${selectedTerm} Term`, 14, 64)
    doc.text(`Session: ${selectedSession}`, 14, 71)
    doc.text(`Attendance: ${attendanceData?.percentage ?? 0}%`, 110, 50)
    if (child.department) doc.text(`Department: ${child.department}`, 110, 57)

    const tableData = grades.map((g: any) => [
      g.subject, g.ca1 ?? 0, g.ca2 ?? 0,
      g.exam ?? 0, g.total ?? 0,
      g.grade_letter ?? '', g.remark ?? ''
    ])

    autoTable(doc, {
      startY: 80,
      head: [['Subject', 'CA1', 'CA2', 'Exam', 'Total', 'Grade', 'Remark']],
      body: tableData,
      headStyles: { fillColor: [10, 22, 40], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [232, 240, 254] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    const avg = grades.length > 0
      ? Math.round(grades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / grades.length)
      : 0

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Average: ${avg}%`, 14, finalY)
    doc.text(`Result: ${avg >= PASS_MARK ? 'PASSED' : 'FAILED'}`, 14, finalY + 7)
    doc.save(`${child.full_name}_${selectedTerm}_Report.pdf`)
    toast.success('Report card downloaded!')
  }

  if (!child) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
        <p>No child linked to your account.</p>
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

      {/* Access Check */}
      {access?.status !== 'approved' ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-school-dark mb-2">
            Report Card Access Locked
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            To view {child.full_name}'s report card,
            please make payment to the school account below.
          </p>

          {/* Bank Details */}
          <div className="bg-school-dark text-white rounded-xl p-5 text-left mb-6">
            <h4 className="font-bold mb-3">Payment Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-300">Bank:</span>
                <span>{BANK_DETAILS.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Account Name:</span>
                <span>{BANK_DETAILS.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Account Number:</span>
                <span className="font-bold">{BANK_DETAILS.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">Amount:</span>
                <span className="font-bold text-green-300">{BANK_DETAILS.amount}</span>
              </div>
            </div>
          </div>

          {access?.status === 'pending' ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-700 text-sm font-medium">
                ⏳ Payment notification sent. Waiting for admin approval...
              </p>
            </div>
          ) : (
            <button
              onClick={() => notifyMutation.mutate()}
              disabled={notifyMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-school-dark text-white rounded-xl py-3 font-medium hover:bg-school-blue disabled:opacity-50"
            >
              <Bell size={18} />
              {notifyMutation.isPending ? 'Sending...' : 'I Have Paid — Notify Admin'}
            </button>
          )}
        </div>
      ) : (
        /* Report Card View */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-school-dark text-white p-6 text-center">
            <h2 className="text-xl font-bold">{SCHOOL_NAME}</h2>
            <p className="text-blue-200 text-sm">{SCHOOL_LOCATION}</p>
            <p className="font-medium mt-1">STUDENT REPORT CARD</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Name:</span> {child.full_name}</p>
                <p><span className="font-medium">Class:</span> {child.class}</p>
                <p><span className="font-medium">Term:</span> {selectedTerm}</p>
              </div>
              <div>
                <p><span className="font-medium">Gender:</span> {child.gender}</p>
                {child.department && (
                  <p><span className="font-medium">Dept:</span> {child.department}</p>
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
              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div className="text-sm">
                  <p className="font-medium">Average: {
                    Math.round(grades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / grades.length)
                  }%</p>
                  <p className="font-medium">Result: {
                    Math.round(grades.reduce((s: number, g: any) => s + (g.total ?? 0), 0) / grades.length) >= PASS_MARK
                      ? '✅ PASSED' : '❌ FAILED'
                  }</p>
                </div>
                <button
                  onClick={generatePDF}
                  className="flex items-center gap-2 bg-school-dark text-white px-4 py-2 rounded-lg text-sm hover:bg-school-blue"
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
