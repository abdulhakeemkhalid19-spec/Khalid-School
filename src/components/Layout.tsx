import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { SCHOOL_NAME, SCHOOL_LOCATION } from '../lib/constants'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  BarChart3,
  UserCog,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

interface NavItem {
  to: string
  label: string
  icon: any
}

interface LayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  title: string
}

export default function Layout({ children, navItems, title }: LayoutProps) {
  const { user, role, signOut } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  const Sidebar = () => (
    <aside className="w-64 min-h-screen bg-school-dark flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-xl">📚</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">{SCHOOL_NAME}</p>
            <p className="text-blue-300 text-xs">{SCHOOL_LOCATION}</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-school-dark'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <p className="text-blue-300 text-xs mb-1">Signed in as</p>
        <p className="text-white text-sm font-medium truncate">{user?.email}</p>
        <p className="text-blue-300 text-xs capitalize mb-3">{role}</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-school-light">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-school-dark text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <span className="font-bold text-sm">{SCHOOL_NAME}</span>
          </div>
          <button onClick={() => setOpen(true)}>
            <Menu size={24} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-school-dark mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  )
}
