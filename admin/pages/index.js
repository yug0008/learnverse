import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { 
  HiArrowRight, 
  HiShieldCheck, 
  HiChartBar, 
  HiUsers, 
  HiCog,
  HiBell,
  HiClock,
  HiSparkles,
  HiTrendingUp,
  HiCalendar,
  HiDocumentReport,
  HiLightningBolt
} from 'react-icons/hi'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    quickActions: 0,
    pendingTasks: 0,
    systemHealth: 100,
    recentUpdates: []
  })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      
      if (error || !authUser) {
        // No user logged in, redirect to login
        router.push('/login')
        return
      }

      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (!userData) {
        // User not found in database, logout and redirect
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      setUser(authUser)
      setUserRole(userData.role)

      // Check if user is admin/teacher/superadmin
      if (['superadmin', 'admin', 'teacher'].includes(userData.role)) {
        // Admin user - fetch dashboard stats
        await fetchDashboardStats()
      }
      // Regular users stay on homepage

    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDashboardStats() {
    try {
      // Fetch real stats from Supabase
      const [
        usersCount,
        bannersCount,
        storageData
      ] = await Promise.all([
        fetchUsersCount(),
        fetchBannersCount(),
        fetchStorageData()
      ])

      setStats({
        quickActions: 4,
        pendingTasks: 3,
        systemHealth: 98,
        recentUpdates: [
          { id: 1, title: 'System Update', time: '2 hours ago', status: 'completed' },
          { id: 2, title: 'Security Patch', time: '1 day ago', status: 'completed' },
          { id: 3, title: 'Database Backup', time: '3 days ago', status: 'completed' },
        ]
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function fetchUsersCount() {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    return count || 0
  }

  async function fetchBannersCount() {
    const { count } = await supabase
      .from('banners')
      .select('*', { count: 'exact', head: true })
    return count || 0
  }

  async function fetchStorageData() {
    try {
      const { data: files } = await supabase.storage
        .from('banners')
        .list()
      return files?.length || 0
    } catch {
      return 0
    }
  }

  const handleAdminRedirect = () => {
    router.push('/admin/dashboard')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If user is admin/teacher/superadmin, show admin dashboard preview
  if (user && ['superadmin', 'admin', 'teacher'].includes(userRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Navigation Bar */}
        <nav className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-white">AD</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                      Admin Portal
                    </h1>
                    <p className="text-xs text-gray-400">Secure Access System</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-300">Connected</span>
                  </div>
                </div>
                
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium text-white truncate max-w-[150px]">{user.email}</p>
                      <p className="text-xs text-purple-300 capitalize">{userRole}</p>
                    </div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm text-white font-medium">{user.email}</p>
                        <p className="text-xs text-purple-300 mt-1 capitalize">{userRole}</p>
                      </div>
                      <button
                        onClick={handleAdminRedirect}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors flex items-center space-x-2"
                      >
                        <HiArrowRight className="w-4 h-4" />
                        <span>Go to Dashboard</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors flex items-center space-x-2"
                      >
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5 bg-grid-16" />
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur-sm border border-purple-500/30 mb-6">
                <HiSparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Welcome to <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Admin Portal</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Secure management dashboard for administrators. Monitor system health, manage users, and control all aspects of your platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button
                  onClick={handleAdminRedirect}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 group"
                >
                  <span>Go to Admin Dashboard</span>
                  <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 text-gray-300 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
                  <HiDocumentReport className="w-5 h-5" />
                  <span>View Documentation</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <HiShieldCheck className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-green-500/20 text-green-400 rounded-full">Secure</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">System Security</h3>
                <p className="text-gray-400 text-sm mb-4">Enterprise-grade security with real-time monitoring</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{stats.systemHealth}%</span>
                  <HiTrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <HiClock className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">Pending</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Quick Actions</h3>
                <p className="text-gray-400 text-sm mb-4">{stats.quickActions} actions awaiting attention</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{stats.pendingTasks}</span>
                  <span className="text-sm text-gray-400">Tasks</span>
                </div>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-green-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <HiBell className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">Active</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Recent Updates</h3>
                <p className="text-gray-400 text-sm mb-4">{stats.recentUpdates.length} system updates completed</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{stats.recentUpdates.length}</span>
                  <HiCalendar className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-pink-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-500/20 rounded-lg">
                    <HiLightningBolt className="w-6 h-6 text-pink-400" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full">Fast</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Performance</h3>
                <p className="text-gray-400 text-sm mb-4">Optimized for speed and reliability</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">99.9%</span>
                  <HiTrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>

            {/* Quick Access Section */}
            <div className="bg-gray-800/20 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Quick Access</h2>
                <span className="text-sm text-gray-400">Common actions</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="p-6 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl transition-all duration-300 hover:border-purple-500/50 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <HiUsers className="w-6 h-6 text-blue-400" />
                    </div>
                    <HiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                  <p className="text-gray-400 text-sm">Manage user accounts and permissions</p>
                </button>

                <button
                  onClick={() => router.push('/admin/banners')}
                  className="p-6 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl transition-all duration-300 hover:border-pink-500/50 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-pink-500/20 rounded-lg">
                      <HiChartBar className="w-6 h-6 text-pink-400" />
                    </div>
                    <HiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Banner Management</h3>
                  <p className="text-gray-400 text-sm">Control website banners and promotions</p>
                </button>

                <button
                  onClick={() => router.push('/admin/settings')}
                  className="p-6 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl transition-all duration-300 hover:border-green-500/50 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <HiCog className="w-6 h-6 text-green-400" />
                    </div>
                    <HiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">System Settings</h3>
                  <p className="text-gray-400 text-sm">Configure system preferences</p>
                </button>

                <button
                  onClick={() => router.push('/admin/analytics')}
                  className="p-6 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl transition-all duration-300 hover:border-purple-500/50 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <HiChartBar className="w-6 h-6 text-purple-400" />
                    </div>
                    <HiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                  <p className="text-gray-400 text-sm">View system metrics and reports</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/20 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Recent System Activity</h2>
                <span className="text-sm text-gray-400">Last 7 days</span>
              </div>
              
              <div className="space-y-4">
                {stats.recentUpdates.map((update) => (
                  <div key={update.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        update.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-white">{update.title}</h4>
                        <p className="text-sm text-gray-400">{update.time}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      update.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {update.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900/50 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">AD</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Admin Portal v2.1.4</p>
                    <p className="text-xs text-gray-500">Secure management system</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">System Status: Online</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Security</h4>
                  <ul className="space-y-2">
                    <li><span className="text-xs text-gray-500">End-to-end encryption</span></li>
                    <li><span className="text-xs text-gray-500">2FA ready</span></li>
                    <li><span className="text-xs text-gray-500">Audit logs</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Features</h4>
                  <ul className="space-y-2">
                    <li><span className="text-xs text-gray-500">User management</span></li>
                    <li><span className="text-xs text-gray-500">Banner control</span></li>
                    <li><span className="text-xs text-gray-500">Real-time analytics</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Support</h4>
                  <ul className="space-y-2">
                    <li><span className="text-xs text-gray-500">Documentation</span></li>
                    <li><span className="text-xs text-gray-500">Security guide</span></li>
                    <li><span className="text-xs text-gray-500">24/7 monitoring</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Legal</h4>
                  <ul className="space-y-2">
                    <li><span className="text-xs text-gray-500">Privacy policy</span></li>
                    <li><span className="text-xs text-gray-500">Terms of service</span></li>
                    <li><span className="text-xs text-gray-500">Compliance</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </footer>

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
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    )
  }

  // If user is logged in but not admin (e.g., student), show basic dashboard
  if (user && userRole === 'student') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Welcome, Student!</h1>
            <p className="text-gray-300 mb-6">
              You don't have administrative access. Please contact your administrator for elevated privileges.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white font-medium">Current Role</p>
                <p className="text-blue-300 capitalize">{userRole}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // This should not render if redirect happens, but keeping as fallback
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Redirecting...</p>
      </div>
    </div>
  )
}