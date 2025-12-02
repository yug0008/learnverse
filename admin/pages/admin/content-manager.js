import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  HiSearch,
  HiRefresh,
  HiViewGrid,
  HiViewList,
  HiPlus,
  HiShieldCheck,
  HiAcademicCap,
  HiBookOpen,
  HiFolder,
  HiTemplate,
  HiClock,
  HiArrowRight,
  HiCheck
} from 'react-icons/hi'
import {
  FaGraduationCap,
  FaShieldAlt,
  FaKey,
  FaDatabase,
  FaChartLine
} from 'react-icons/fa'

export default function ContentManager() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalChapters: 0,
    totalTopics: 0,
    totalFormulaCards: 0
  })
  const [recentTopics, setRecentTopics] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')

  // Content Manager Cards - Only for the tables provided
  const contentModules = [
    {
      id: 'subjects',
      title: 'Subjects Manager',
      description: 'Manage subjects organized by exams and curriculum',
      icon: FaGraduationCap,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      href: '/admin/subject',
      stats: 'Total Subjects',
      permission: ['superadmin', 'admin', 'teacher'],
      gradient: 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent'
    },
    {
      id: 'chapters',
      title: 'Chapters Manager',
      description: 'Organize chapters under subjects hierarchically',
      icon: HiBookOpen,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      href: '/admin/chapters',
      stats: 'Total Chapters',
      permission: ['superadmin', 'admin', 'teacher'],
      gradient: 'bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent'
    },
    {
      id: 'topics',
      title: 'Topics Manager',
      description: 'Manage topics within chapters for formula organization',
      icon: HiFolder,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      href: '/admin/topics',
      stats: 'Total Topics',
      permission: ['superadmin', 'admin', 'teacher'],
      gradient: 'bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent'
    },
    {
      id: 'formulacards',
      title: 'Formula Cards',
      description: 'Create and manage formula cards with content',
      icon: HiAcademicCap,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      href: '/admin/formulacards',
      stats: 'Total Cards',
      permission: ['superadmin', 'admin', 'teacher'],
      gradient: 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent'
    }
  ]

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  async function checkUserAndFetchData() {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/login?redirect=/admin/content-manager')
        return
      }

      // Fetch user data with service role for security
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        console.error('User verification failed:', userError)
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      // Check role permissions
      if (!['superadmin', 'admin', 'teacher'].includes(userData.role)) {
        router.push('/not-allowed')
        return
      }

      setUser(userData)
      setUserRole(userData.role)

      // Fetch all data
      await Promise.all([
        fetchStats(),
        fetchRecentTopics()
      ])
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      // Fetch counts from all tables using RLS
      const [
        { count: subjectsCount },
        { count: chaptersCount },
        { count: topicsCount },
        { count: formulaCardsCount }
      ] = await Promise.all([
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('topics').select('*', { count: 'exact', head: true }),
        supabase.from('formula_cards').select('*', { count: 'exact', head: true })
      ])

      setStats({
        totalSubjects: subjectsCount || 0,
        totalChapters: chaptersCount || 0,
        totalTopics: topicsCount || 0,
        totalFormulaCards: formulaCardsCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function fetchRecentTopics() {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          id,
          name,
          created_at,
          chapters:chapter_id (
            name,
            subjects:subject_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentTopics(data || [])
    } catch (error) {
      console.error('Error fetching recent topics:', error)
    }
  }

  const filteredModules = contentModules.filter(module => {
    if (!module.permission.includes(userRole)) return false
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return module.title.toLowerCase().includes(searchLower) || 
             module.description.toLowerCase().includes(searchLower)
    }
    
    return true
  })

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchRecentTopics()
    ])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FaShieldAlt className="w-10 h-10 text-blue-400 animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mt-4">Verifying Permissions</h3>
          <p className="text-gray-400 text-sm mt-2">Checking admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <HiTemplate className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Content Manager</h1>
                <p className="text-xs text-gray-400">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Fixed Search Bar - Increased left padding */}
              <div className="hidden md:block">
                <div className="relative">
                  <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search modules..."
                    className="w-64 pl-11 pr-4 py-2.5 bg-gray-900/70 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-300"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-2 px-4 py-2.5 bg-gray-700/50 rounded-xl border border-gray-600">
                <FaKey className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-gray-300 font-medium capitalize">{userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="lg:max-w-lg">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{user?.email?.split('@')[0] || 'Admin'}</span> 👋
                </h2>
                <p className="text-gray-400 text-lg">
                  Manage your educational content ecosystem with powerful tools and analytics
                </p>
                <div className="flex items-center space-x-4 mt-6">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-300">System Status:</span>
                    <span className="text-green-400 font-medium">Operational</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <FaShieldAlt className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-300">Security:</span>
                    <span className="text-blue-400 font-medium">Active</span>
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-emerald-500/30 transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-all">
                      <FaGraduationCap className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Subjects</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.totalSubjects}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-purple-500/30 transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                      <HiBookOpen className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Chapters</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.totalChapters}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-blue-500/30 transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
                      <HiFolder className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Topics</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.totalTopics}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 hover:border-amber-500/30 transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:bg-amber-500/30 transition-all">
                      <HiAcademicCap className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Formula Cards</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.totalFormulaCards}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search - Fixed */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search content modules..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800/70 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>
        </div>

        {/* Content Modules Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Content Management</h3>
              <p className="text-gray-400">Access and manage all your educational content</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
                title="Refresh Data"
              >
                <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
              
              {/* View Toggle */}
              <div className="flex items-center space-x-1 bg-gray-800/50 rounded-xl p-1 border border-gray-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500/20 text-blue-400 shadow-inner' 
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <HiViewGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-blue-500/20 text-blue-400 shadow-inner' 
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <HiViewList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Grid/List */}
          {filteredModules.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700">
              <HiSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">No modules found</h4>
              <p className="text-gray-400">Try adjusting your search terms</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredModules.map((module) => {
                const Icon = module.icon
                let statCount = 0
                switch(module.id) {
                  case 'subjects': statCount = stats.totalSubjects; break
                  case 'chapters': statCount = stats.totalChapters; break
                  case 'topics': statCount = stats.totalTopics; break
                  case 'formulacards': statCount = stats.totalFormulaCards; break
                }
                
                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    className="group block transform hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className={`h-full ${module.bgColor} ${module.borderColor} border-2 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-sm relative overflow-hidden`}>
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      {/* Content Container */}
                      <div className="relative z-10">
                        {/* Icon and Stats - Fixed spacing */}
                        <div className="flex items-center justify-between mb-6">
                          <div className={`w-14 h-14 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">{statCount}</div>
                            <div className="text-xs text-gray-400 font-medium tracking-wide mt-1">{module.stats}</div>
                          </div>
                        </div>

                        {/* Title and Description - Added margin */}
                        <h4 className="text-lg font-bold text-white mb-3 group-hover:text-gray-100 transition-colors">
                          {module.title}
                        </h4>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                          {module.description}
                        </p>

                        {/* Footer with Permissions - Fixed spacing */}
                        <div className="flex items-center justify-between pt-5 border-t border-gray-700/50">
                          <div className="text-xs text-gray-500 font-medium">
                            {module.permission.join(', ')} access
                          </div>
                          <div className={`w-10 h-10 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300`}>
                            <HiPlus className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredModules.map((module) => {
                const Icon = module.icon
                let statCount = 0
                switch(module.id) {
                  case 'subjects': statCount = stats.totalSubjects; break
                  case 'chapters': statCount = stats.totalChapters; break
                  case 'topics': statCount = stats.totalTopics; break
                  case 'formulacards': statCount = stats.totalFormulaCards; break
                }
                
                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    className="group block"
                  >
                    <div className={`${module.bgColor} ${module.borderColor} border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl backdrop-blur-sm`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-5">
                          <div className={`w-14 h-14 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="pr-4">
                            <h4 className="text-lg font-bold text-white mb-1">{module.title}</h4>
                            <p className="text-gray-400 text-sm">{module.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{statCount}</div>
                            <div className="text-xs text-gray-400">{module.stats}</div>
                          </div>
                          <div className={`w-10 h-10 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all`}>
                            <HiPlus className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                <p className="text-gray-400 text-sm mt-1">Latest topics created in the system</p>
              </div>
              <Link
                href="/admin/topics"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2 group"
              >
                <span>View All</span>
                <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          {recentTopics.length > 0 ? (
            <div className="divide-y divide-gray-700/50">
              {recentTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-5 hover:bg-gray-700/20 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <HiFolder className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{topic.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                        <span>{topic.chapters?.name}</span>
                        <span>•</span>
                        <span>{topic.chapters?.subjects?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {new Date(topic.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <Link
                      href={`/admin/topics/${topic.id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center space-x-1 mt-1"
                    >
                      <span>Manage</span>
                      <HiArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HiClock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No recent activity yet</p>
              <Link
                href="/admin/topics/new"
                className="text-sm text-blue-400 hover:text-blue-300 inline-block mt-2"
              >
                Create your first topic →
              </Link>
            </div>
          )}
        </div>

        {/* Info Cards Grid - Fixed spacing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Security Status Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <HiShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white">Security Status</h4>
                <p className="text-sm text-gray-400">System authentication status</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-300">Role Access</span>
                </div>
                <span className="text-sm font-medium text-amber-400 capitalize">{userRole}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-300">Authentication</span>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                  <HiCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-6">
            <div className="mb-6">
              <h4 className="font-bold text-white mb-2">Quick Actions</h4>
              <p className="text-sm text-gray-400">Frequently used operations</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/admin/topics/new"
                className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all duration-300 group text-center"
              >
                <HiFolder className="w-5 h-5 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-blue-300">New Topic</span>
              </Link>
              <Link
                href="/admin/formulacards/new"
                className="p-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl transition-all duration-300 group text-center"
              >
                <HiAcademicCap className="w-5 h-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-amber-300">New Card</span>
              </Link>
              <Link
                href="/admin/chapters/new"
                className="p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-all duration-300 group text-center"
              >
                <HiBookOpen className="w-5 h-5 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-purple-300">New Chapter</span>
              </Link>
              <Link
                href="/admin/subject/new"
                className="p-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl transition-all duration-300 group text-center"
              >
                <FaGraduationCap className="w-5 h-5 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-emerald-300">New Subject</span>
              </Link>
            </div>
          </div>

          {/* System Info Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaDatabase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white">System Overview</h4>
                <p className="text-sm text-gray-400">Content statistics summary</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaChartLine className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">Active Modules</span>
                </div>
                <span className="text-lg font-bold text-white">{filteredModules.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaDatabase className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Total Content Items</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {stats.totalSubjects + stats.totalChapters + stats.totalTopics + stats.totalFormulaCards}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaShieldAlt className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Last Data Refresh</span>
                </div>
                <span className="text-sm text-gray-400">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <FaShieldAlt className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Secure Admin Portal v2.0</p>
                <p className="text-xs text-gray-500">Protected by RLS & Service Role</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Connected</span>
              </div>
              <div className="text-xs text-gray-500">
                Role: <span className="text-amber-400 font-medium capitalize">{userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}