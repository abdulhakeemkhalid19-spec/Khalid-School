import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import {
  LayoutDashboard,
  FileText,
  Bell,
  Clock,
  Calendar,
} from 'lucide-react'
import StudentHome from './Home'
import StudentReportCard from './ReportCard'
import StudentNotices from './Notices'
import StudentTimetable from './Timetable'
import StudentCalendar from './Calendar'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/report-card', label: 'Report Card', icon: FileText },
  { to: '/notices', label: 'Notices', icon: Bell },
  { to: '/timetable', label: 'Timetable', icon: Clock },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
]

export default function StudentDashboard() {
  return (
    <Routes>
      <Route path="/" element={
        <Layout navItems={navItems} title="Student Dashboard">
          <StudentHome />
        </Layout>
      } />
      <Route path="/dashboard" element={
        <Layout navItems={navItems} title="Student Dashboard">
          <StudentHome />
        </Layout>
      } />
      <Route path="/report-card" element={
        <Layout navItems={navItems} title="Report Card">
          <StudentReportCard />
        </Layout>
      } />
      <Route path="/notices" element={
        <Layout navItems={navItems} title="Notices">
          <StudentNotices />
        </Layout>
      } />
      <Route path="/timetable" element={
        <Layout navItems={navItems} title="Timetable">
          <StudentTimetable />
        </Layout>
      } />
      <Route path="/calendar" element={
        <Layout navItems={navItems} title="Calendar">
          <StudentCalendar />
        </Layout>
      } />
    </Routes>
  )
}
