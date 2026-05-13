import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Clock,
  Calendar,
} from 'lucide-react'
import TeacherHome from './Home'
import TeacherStudents from './Students'
import TeacherGrades from './Grades'
import TeacherAttendance from './Attendance'
import TeacherTimetable from './Timetable'
import TeacherCalendar from './Calendar'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'My Students', icon: Users },
  { to: '/grades', label: 'Grades', icon: BookOpen },
  { to: '/attendance', label: 'Attendance', icon: ClipboardList },
  { to: '/timetable', label: 'Timetable', icon: Clock },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
]

export default function TeacherDashboard() {
  return (
    <Routes>
      <Route path="/" element={
        <Layout navItems={navItems} title="Teacher Dashboard">
          <TeacherHome />
        </Layout>
      } />
      <Route path="/dashboard" element={
        <Layout navItems={navItems} title="Teacher Dashboard">
          <TeacherHome />
        </Layout>
      } />
      <Route path="/students" element={
        <Layout navItems={navItems} title="My Students">
          <TeacherStudents />
        </Layout>
      } />
      <Route path="/grades" element={
        <Layout navItems={navItems} title="Grades">
          <TeacherGrades />
        </Layout>
      } />
      <Route path="/attendance" element={
        <Layout navItems={navItems} title="Attendance">
          <TeacherAttendance />
        </Layout>
      } />
      <Route path="/timetable" element={
        <Layout navItems={navItems} title="Timetable">
          <TeacherTimetable />
        </Layout>
      } />
      <Route path="/calendar" element={
        <Layout navItems={navItems} title="Calendar">
          <TeacherCalendar />
        </Layout>
      } />
    </Routes>
  )
}
