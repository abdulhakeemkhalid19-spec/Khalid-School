import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  Bell,
  UserCog,
  BarChart3,
  Calendar,
  Clock,
  CreditCard,
  Link,
} from 'lucide-react'
import AdminHome from './Home'
import Students from './Students'
import Teachers from './Teachers'
import Grades from './Grades'
import Attendance from './Attendance'
import ReportCards from './ReportCards'
import Notices from './Notices'
import Accounts from './Accounts'
import Analytics from './Analytics'
import Timetable from './Timetable'
import SchoolCalendar from './SchoolCalendar'
import Payments from './Payments'
import LinkParents from './LinkParents'
import FeeManagement from './FeeManagement'
import { Wallet } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/teachers', label: 'Teachers', icon: GraduationCap },
  { to: '/grades', label: 'Grades', icon: BookOpen },
  { to: '/attendance', label: 'Attendance', icon: ClipboardList },
  { to: '/report-cards', label: 'Report Cards', icon: FileText },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/notices', label: 'Notices', icon: Bell },
  { to: '/timetable', label: 'Timetable', icon: Clock },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/link-parents', label: 'Link Parents', icon: Link },
  { to: '/accounts', label: 'Accounts', icon: UserCog },
  { to: '/fees', label: 'Fee Management', icon: Wallet },
]

export default function AdminDashboard() {
  return (
    <Routes>
      <Route path="/" element={
        <Layout navItems={navItems} title="Admin Dashboard">
          <AdminHome />
        </Layout>
      } />
      <Route path="/dashboard" element={
        <Layout navItems={navItems} title="Admin Dashboard">
          <AdminHome />
        </Layout>
      } />
      <Route path="/students" element={
        <Layout navItems={navItems} title="Students">
          <Students />
        </Layout>
      } />
      <Route path="/teachers" element={
        <Layout navItems={navItems} title="Teachers">
          <Teachers />
        </Layout>
      } />
      <Route path="/grades" element={
        <Layout navItems={navItems} title="Grades">
          <Grades />
        </Layout>
      } />
      <Route path="/attendance" element={
        <Layout navItems={navItems} title="Attendance">
          <Attendance />
        </Layout>
      } />
      <Route path="/report-cards" element={
        <Layout navItems={navItems} title="Report Cards">
          <ReportCards />
        </Layout>
      } />
      <Route path="/payments" element={
        <Layout navItems={navItems} title="Payments">
          <Payments />
        </Layout>
      } />
      <Route path="/notices" element={
        <Layout navItems={navItems} title="Notices">
          <Notices />
        </Layout>
      } />
      <Route path="/timetable" element={
        <Layout navItems={navItems} title="Timetable">
          <Timetable />
        </Layout>
      } />
      <Route path="/calendar" element={
        <Layout navItems={navItems} title="School Calendar">
          <SchoolCalendar />
        </Layout>
      } />
      <Route path="/analytics" element={
        <Layout navItems={navItems} title="Analytics">
          <Analytics />
        </Layout>
      } />
      <Route path="/link-parents" element={
        <Layout navItems={navItems} title="Link Parents & Students">
          <LinkParents />
        </Layout>
      } />
      <Route path="/accounts" element={
        <Layout navItems={navItems} title="Accounts">
          <Accounts />
        </Layout>
      } />
      <Route path="/fees" element={
      <Layout navItems={navItems} title="Fee Management">
          <FeeManagement />
      </Layout>
      } />
      </Routes>
  )
}
