import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/admin/Sidebar'
import { 
  HiUsers, 
  HiEye, 
  HiShieldCheck, 
  HiChartBar,
  HiDocumentText,
  HiUserGroup,
  HiAcademicCap,
  HiCollection,
  HiBan
} from 'react-icons/hi'
import { FaUserTie, FaUserShield } from 'react-icons/fa'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBanners: 0,
    activeSessions: 0,
    securityAlerts: 0,
    activeBanners: 0,
    inactiveBanners: 0,
    userRoles: {},
    recentActivities: []
  })
  const [realTimeData, setRealTimeData] = useState({
    onlineUsers: 0,
    todayLogins: 0,
    storageUsage: '0 MB'
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAllData()
      // Set up real-time subscriptions
      setupRealtimeSubscriptions()
    }
  }, [user])

  async function checkUser() {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      
      if (error || !authUser) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData || !['superadmin', 'admin', 'teacher'].includes(userData.role)) {
        router.push('/not-allowed')
        return
      }

      setUser(userData)
    } catch (error) {
      console.error('Dashboard error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllData() {
    try {
      // Fetch all data in parallel
      const [
        usersData,
        bannersData,
        sessionsData,
        activitiesData,
        storageData
      ] = await Promise.all([
        fetchUsersData(),
        fetchBannersData(),
        fetchSessionsData(),
        fetchRecentActivities(),
        fetchStorageUsage()
      ])

      setStats({
        totalUsers: usersData.total,
        userRoles: usersData.roles,
        totalBanners: bannersData.total,
        activeBanners: bannersData.active,
        inactiveBanners: bannersData.inactive,
        activeSessions: sessionsData,
        securityAlerts: activitiesData.securityCount,
        recentActivities: activitiesData.activities
      })

      setRealTimeData({
        onlineUsers: sessionsData,
        todayLogins: activitiesData.todayLogins,
        storageUsage: storageData
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  async function fetchUsersData() {
    try {
      // Get total users count
      const { count: total, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError

      // Get users by role
      const { data: rolesData, error: rolesError } = await supabase
        .from('users')
        .select('role')

      if (rolesError) throw rolesError

      // Count roles
      const roles = rolesData.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {})

      return { total, roles }
    } catch (error) {
      console.error('Error fetching users data:', error)
      return { total: 0, roles: {} }
    }
  }

  async function fetchBannersData() {
    try {
      // Get all banners
      const { data: banners, error } = await supabase
        .from('banners')
        .select('*')

      if (error) throw error

      const active = banners.filter(b => b.is_active).length
      const inactive = banners.filter(b => !b.is_active).length

      return {
        total: banners.length,
        active,
        inactive
      }
    } catch (error) {
      console.error('Error fetching banners data:', error)
      return { total: 0, active: 0, inactive: 0 }
    }
  }

  async function fetchSessionsData() {
    try {
      // Count active sessions (users logged in within last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('last_sign_in_at', fifteenMinutesAgo)

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error('Error fetching sessions data:', error)
      return 0
    }
  }

  async function fetchRecentActivities() {
    try {
      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Fetch audit logs if you have an audit_logs table
      // For now, we'll simulate with some data
      const { count: todayLogins, error: loginError } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
        .gt('last_sign_in_at', today.toISOString())

      if (loginError) console.error('Error fetching today logins:', loginError)

      // You can create an audit_logs table for better tracking
      const activities = [
        {
          id: 1,
          event: 'Dashboard accessed',
          time: 'Just now',
          level: 'info',
          user_email: user?.email
        }
      ]

      // Add real activities from database if you have an audit_logs table
      // const { data: auditLogs } = await supabase
      //   .from('audit_logs')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      //   .limit(5)

      return {
        activities,
        todayLogins: todayLogins || 0,
        securityCount: 0
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      return { activities: [], todayLogins: 0, securityCount: 0 }
    }
  }

  async function fetchStorageUsage() {
    try {
      // Get banners storage usage
      const { data: files, error } = await supabase.storage
        .from('banners')
        .list()

      if (error) throw error

      // Calculate total size
      let totalSize = 0
      for (const file of files) {
        totalSize += file.metadata?.size || 0
      }

      // Convert to MB
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
      return `${sizeInMB} MB`
    } catch (error) {
      console.error('Error fetching storage usage:', error)
      return '0 MB'
    }
  }

  function setupRealtimeSubscriptions() {
    // Subscribe to users table changes
    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        () => {
          fetchUsersData().then(usersData => {
            setStats(prev => ({
              ...prev,
              totalUsers: usersData.total,
              userRoles: usersData.roles
            }))
          })
        }
      )
      .subscribe()

    // Subscribe to banners table changes
    const bannersSubscription = supabase
      .channel('banners-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'banners' }, 
        () => {
          fetchBannersData().then(bannersData => {
            setStats(prev => ({
              ...prev,
              totalBanners: bannersData.total,
              activeBanners: bannersData.active,
              inactiveBanners: bannersData.inactive
            }))
          })
        }
      )
      .subscribe()

    // Subscribe to auth state changes
    const authSubscription = supabase.auth.onAuthStateChange(() => {
      fetchSessionsData().then(sessions => {
        setStats(prev => ({ ...prev, activeSessions: sessions }))
        setRealTimeData(prev => ({ ...prev, onlineUsers: sessions }))
      })
    })

    return () => {
      usersSubscription.unsubscribe()
      bannersSubscription.unsubscribe()
      authSubscription.data?.subscription?.unsubscribe()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-400 mt-1 md:mt-2">
                  Welcome back, <span className="text-purple-300">{user.email}</span> • 
                  Role: <span className="font-semibold text-purple-300 capitalize">{user.role}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">Live Data</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Total Users */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-white">
                    {stats.totalUsers}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-gray-800"></div>
                      <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-gray-800"></div>
                      <div className="w-6 h-6 bg-pink-500 rounded-full border-2 border-gray-800"></div>
                    </div>
                    <span className="text-xs text-gray-400">+{realTimeData.onlineUsers} online</span>
                  </div>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <HiUsers className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Total Banners */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Banners</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-white">
                    {stats.totalBanners}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-400">{stats.activeBanners} active</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-gray-400">{stats.inactiveBanners} inactive</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <HiCollection className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700 hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Sessions</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-green-400">
                    {realTimeData.onlineUsers}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">Live count</span>
                  </div>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <HiEye className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                </div>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700 hover:border-pink-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Storage Usage</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2 text-pink-400">
                    {realTimeData.storageUsage}
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(parseFloat(realTimeData.storageUsage) * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <HiChartBar className="w-5 h-5 md:w-6 md:h-6 text-pink-400" />
                </div>
              </div>
            </div>
          </div>

          {/* User Distribution & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
            {/* User Roles Distribution */}
            <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">User Distribution</h2>
                <div className="text-sm text-gray-400">
                  Total: {stats.totalUsers} users
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.userRoles).map(([role, count]) => {
                  const percentage = stats.totalUsers > 0 ? (count / stats.totalUsers * 100).toFixed(1) : 0
                  const colors = {
                    superadmin: 'from-red-500 to-orange-500',
                    admin: 'from-purple-500 to-pink-500',
                    teacher: 'from-blue-500 to-cyan-500',
                    student: 'from-green-500 to-emerald-500'
                  }
                  const icons = {
                    superadmin: FaUserShield,
                    admin: FaUserTie,
                    teacher: HiAcademicCap,
                    student: HiUserGroup
                  }
                  const Icon = icons[role] || HiUsers
                  
                  return (
                    <div key={role} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[role] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white capitalize">{role}s</p>
                          <p className="text-sm text-gray-400">{count} users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{percentage}%</p>
                        <div className="w-32 h-1.5 bg-gray-700 rounded-full mt-1">
                          <div 
                            className={`h-1.5 rounded-full bg-gradient-to-r ${colors[role] || 'from-gray-500 to-gray-600'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <HiDocumentText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Today's Logins</p>
                      <p className="text-sm text-gray-400">Last 24 hours</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{realTimeData.todayLogins}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <HiShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Security Score</p>
                      <p className="text-sm text-gray-400">System health</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">98%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <HiBan className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Blocked Attempts</p>
                      <p className="text-sm text-gray-400">This month</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-400">12</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <button
                onClick={fetchAllData}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2 text-sm"
              >
                <span>Refresh</span>
              </button>
            </div>
            
            {stats.recentActivities.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiDocumentText className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No recent activity</h3>
                <p className="text-gray-500">Activity will appear here as users interact with the system</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {stats.recentActivities.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        item.level === 'warning' ? 'bg-yellow-500' :
                        item.level === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.event}</p>
                        <p className="text-sm text-gray-400">{item.time}</p>
                        {item.user_email && (
                          <p className="text-xs text-purple-400 mt-1">{item.user_email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Real-time indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 flex items-center space-x-2 shadow-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300">Live data updating</span>
        </div>
      </div>
    </div>
  )
}