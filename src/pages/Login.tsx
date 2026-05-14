import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { SCHOOL_NAME, SCHOOL_LOCATION } from '../lib/constants'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [role, setRole] = useState('student')

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Password reset email sent! Check your inbox.')
      setIsForgotPassword(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: role,
          })
          toast.success('Account created! You can now log in.')
          setIsSignUp(false)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Welcome back!')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-school-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{SCHOOL_NAME}</h1>
          <p className="text-blue-300 text-sm mt-1">{SCHOOL_LOCATION}</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-school-dark mb-6 text-center">
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                placeholder="Enter your email"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Enter your password"
                />
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  I am a...
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button
              onClick={isForgotPassword ? handleForgotPassword : handleSubmit}
              disabled={loading}
              className="w-full bg-school-dark text-white rounded-lg py-3 font-semibold hover:bg-school-blue transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Please wait...'
                : isForgotPassword
                ? 'Send Reset Email'
                : isSignUp
                ? 'Create Account'
                : 'Sign In'}
            </button>
          </div>

          {!isSignUp && !isForgotPassword && (
            <p className="text-center text-sm text-gray-500 mt-4">
              <button
                onClick={() => setIsForgotPassword(true)}
                className="text-school-dark font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </p>
          )}

          {isForgotPassword ? (
            <p className="text-center text-sm text-gray-500 mt-4">
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-school-dark font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          ) : (
            <p className="text-center text-sm text-gray-500 mt-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-school-dark font-semibold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          © {new Date().getFullYear()} {SCHOOL_NAME}
        </p>
      </div>
    </div>
  )
              }
