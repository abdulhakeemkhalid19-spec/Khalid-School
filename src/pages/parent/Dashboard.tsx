import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import {
  LayoutDashboard,
  FileText,
  Bell,
  Clock,
  Calendar,
  Wallet,
} from 'lucide-react'
import ParentHome from './Home'
import ParentReportCard from './ReportCard'
import ParentNotices from './Notices'
import ParentTimetable from './Timetable'
import ParentCalendar from './Calendar'
import ParentFees from './Fees'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/report-card', label: 'Report Card', icon: FileText },
  { to: '/fees', label: 'School Fees', icon: Wallet },
  { to: '/notices', label: 'Notices', icon: Bell },
  { to: '/timetable', label: 'Timetable', icon: Clock },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
]

export default function ParentDashboard() {
  return (
    <Routes>
      <Route path="/" element={
        <Layout navItems={navItems} title="Parent Dashboard">
          <ParentHome />
        </Layout>
      } />
      <Route path="/dashboard" element={
        <Layout navItems={navItems} title="Parent Dashboard">
          <ParentHome />
        </Layout>
      } />
      <Route path="/report-card" element={
        <Layout navItems={navItems} title="Report Card">
          <ParentReportCard />
        </Layout>
      } />
      <Route path="/fees" element={
        <Layout navItems={navItems} title="School Fees">
          <ParentFees />
        </Layout>
      } />
      <Route path="/notices" element={
        <Layout navItems={navItems} title="Notices">
          <ParentNotices />
        </Layout>
      } />
      <Route path="/timetable" element={
        <Layout navItems={navItems} title="Timetable">
          <ParentTimetable />
        </Layout>
      } />
      <Route path="/calendar" element={
        <Layout navItems={navItems} title="Calendar">
          <ParentCalendar />
        </Layout>
      } />
    </Routes>
  )
}
