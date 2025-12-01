import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { FcGoogle } from 'react-icons/fc'
import { HiEye, HiEyeOff } from 'react-icons/hi'
import { createClient } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check if user is already logged in
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check user role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData && ['superadmin', 'admin', 'teacher'].includes(userData.role)) {
          router.push('/admin/dashboard')
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) throw error

      if (data.user) {
        // Verify user has admin role
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (roleError || !userData) {
          throw new Error('Unable to verify user role')
        }

        const allowedRoles = ['superadmin', 'admin', 'teacher']
        if (!allowedRoles.includes(userData.role)) {
          await supabase.auth.signOut()
          setError('Access denied. Admin privileges required.')
          return
        }

        setSuccess('Login successful! Redirecting...')
        router.push('/admin/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Google login error:', error)
      setError('Google login failed. Please try again.')
      setLoading(false)
    }
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_85%)]" />
      
      <div className="relative w-full max-w-md z-10">
        {/* Animated Background Blobs - Updated colors to match slate theme */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-slate-700/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-slate-600/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-40 -right-10 w-72 h-72 bg-slate-500/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Logo/Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl shadow-lg mb-4">
              <span className="text-2xl font-bold text-white">AD</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-gray-300 mt-2">Secure access for authorized personnel only</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl backdrop-blur-sm">
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                />
                <div className="absolute right-3 top-3.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all pr-12"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Minimum 8 characters required</p>
            </div>

            <button
              type="submit"
              disabled={loading || !validateEmail(email) || password.length < 8}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                'Secure Login'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-white/10" />
            <span className="px-4 text-sm text-gray-400">OR CONTINUE WITH</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center group"
          >
            <FcGoogle className="w-5 h-5 mr-3" />
            <span>Sign in with Google</span>
            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </button>

          {/* Security Badges */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                <span>2FA Ready</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-2" />
                <span>RBAC Protected</span>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <p className="text-center text-xs text-gray-500 mt-6">
            By accessing this portal, you agree to our security protocols.<br />
            Unauthorized access attempts are logged and reported.
          </p>
        </div>

        {/* Version Info */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">v2.1.4 • Secure Admin Portal</p>
        </div>
      </div>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}