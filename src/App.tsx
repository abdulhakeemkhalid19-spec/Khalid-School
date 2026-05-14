function AppRoutes() {
  const { user, role, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  if (loading && !timedOut) return (
    <div className="min-h-screen bg-school-dark flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-4xl mb-4">📚</div>
        <p>Loading...</p>
      </div>
    </div>
  )

  if (!user) return <Login />

  if (role === 'admin') return (
    <Routes>
      <Route path="/*" element={<AdminDashboard />} />
    </Routes>
  )

  if (role === 'teacher') return (
    <Routes>
      <Route path="/*" element={<TeacherDashboard />} />
    </Routes>
  )

  if (role === 'parent') return (
    <Routes>
      <Route path="/*" element={<ParentDashboard />} />
    </Routes>
  )

  if (role === 'student') return (
    <Routes>
      <Route path="/*" element={<StudentDashboard />} />
    </Routes>
  )

  return (
    <div className="min-h-screen bg-school-dark flex items-center justify-center">
      <div className="text-white text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Account Pending</h2>
        <p className="text-gray-300">Your account has no role assigned yet.</p>
        <p className="text-gray-300">Please contact the school admin.</p>
      </div>
    </div>
  )
}
