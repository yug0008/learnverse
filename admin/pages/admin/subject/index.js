import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  HiPlus, HiPencil, HiTrash, HiBookOpen,
  HiSearch, HiFilter, HiSortAscending, 
  HiSortDescending, HiRefresh, HiX,
  HiChevronDown, HiCollection, HiChartBar,
  HiAcademicCap, HiHashtag
} from 'react-icons/hi'
import { FaGraduationCap } from 'react-icons/fa'

export default function SubjectsList() {
  const router = useRouter()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  // Stats
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalChapters: 0,
    totalTopics: 0,
    totalFormulaCards: 0
  })
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('order')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedExam, setSelectedExam] = useState('')
  const [exams, setExams] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    fetchExams()
  }, [])

  async function checkUserAndFetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData || !['superadmin', 'admin', 'teacher'].includes(userData.role)) {
        router.push('/not-allowed')
        return
      }

      setUserRole(userData.role)
      await Promise.all([
        fetchSubjects(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  async function fetchSubjects() {
    setLoading(true)
    try {
      // Get all subjects with exams
      let query = supabase
        .from('subjects')
        .select(`
          *,
          exams:exam_id (id, name)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
      }
      if (selectedExam) {
        query = query.eq('exam_id', selectedExam)
      }

      const { data: subjectsData, error } = await query

      if (error) throw error

      // Get counts separately with simpler queries
      const subjectsWithCounts = await Promise.all(
        subjectsData.map(async (subject) => {
          try {
            // Get chapters for this subject
            const { data: chapters, error: chaptersError } = await supabase
              .from('chapters')
              .select('id')
              .eq('subject_id', subject.id)

            const chaptersCount = chapters?.length || 0

            // Get topics for this subject (through chapters)
            let topicsCount = 0
            if (chaptersCount > 0) {
              const chapterIds = chapters.map(ch => ch.id)
              const { data: topics, error: topicsError } = await supabase
                .from('topics')
                .select('id')
                .in('chapter_id', chapterIds)
              
              topicsCount = topics?.length || 0

              // Get formula cards for this subject (through topics)
              let formulaCardsCount = 0
              if (topicsCount > 0) {
                const topicIds = topics.map(t => t.id)
                const { data: formulaCards, error: cardsError } = await supabase
                  .from('formula_cards')
                  .select('id')
                  .in('topic_id', topicIds)
                
                formulaCardsCount = formulaCards?.length || 0
              }

              return {
                ...subject,
                chapters_count: chaptersCount,
                topics_count: topicsCount,
                formula_cards_count: formulaCardsCount
              }
            }

            return {
              ...subject,
              chapters_count: 0,
              topics_count: 0,
              formula_cards_count: 0
            }
          } catch (error) {
            console.error(`Error fetching counts for subject ${subject.id}:`, error)
            return {
              ...subject,
              chapters_count: 0,
              topics_count: 0,
              formula_cards_count: 0
            }
          }
        })
      )

      setSubjects(subjectsWithCounts)
    } catch (error) {
      console.error('Error fetching subjects:', error)
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchExams() {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('name')

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  async function fetchStats() {
    try {
      // Get simple counts
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

  async function deleteSubject(id) {
    try {
      // First check if subject has chapters
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('subject_id', id)
        .limit(1)

      if (chapters && chapters.length > 0) {
        alert('Cannot delete subject that has chapters. Please delete all chapters first.')
        return
      }

      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setSubjects(subjects.filter(subject => subject.id !== id))
      setDeleteConfirm(null)
      await Promise.all([fetchStats(), fetchSubjects()])
    } catch (error) {
      console.error('Error deleting subject:', error)
      alert('Failed to delete subject. Make sure it has no associated chapters.')
    }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedExam('')
  }

  const filteredSubjects = subjects.filter(subject => {
    if (!searchTerm && !selectedExam) return true
    
    let matches = true
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      matches = subject.name.toLowerCase().includes(searchLower) || 
                subject.slug.toLowerCase().includes(searchLower)
    }
    if (selectedExam && subject.exam_id !== selectedExam) {
      matches = false
    }
    
    return matches
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading subjects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Subjects Management
              </h1>
              <p className="text-gray-400 mt-2">Organize subjects by exams and manage curriculum structure</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => Promise.all([fetchSubjects(), fetchStats()])}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
              >
                <HiRefresh className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <Link
                href="/admin/subject/new"
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <HiPlus className="w-5 h-5" />
                <span>New Subject</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Subjects</p>
                <p className="text-3xl font-bold mt-2 text-white">{stats.totalSubjects}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Active</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <FaGraduationCap className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Chapters</p>
                <p className="text-3xl font-bold mt-2 text-purple-400">{stats.totalChapters}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-gray-400">Across all subjects</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <HiBookOpen className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Topics</p>
                <p className="text-3xl font-bold mt-2 text-blue-400">{stats.totalTopics}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-400">Detailed topics</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <HiCollection className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Your Role</p>
                <p className="text-2xl font-bold mt-2 capitalize text-teal-300">{userRole}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Active</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <div className="text-xs font-bold text-teal-300">SUB</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search subjects by name or slug..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors flex items-center space-x-2"
              >
                <HiFilter className="w-5 h-5" />
                <span>Filters</span>
                {filtersOpen ? <HiChevronDown className="w-5 h-5 rotate-180" /> : <HiChevronDown className="w-5 h-5" />}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors flex items-center space-x-2"
              >
                <HiX className="w-5 h-5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-700">
              {/* Exam Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by Exam
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">All Exams</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Controls */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSort('name')}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                      sortBy === 'name' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <span>Name</span>
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <HiSortAscending className="w-4 h-4" /> : <HiSortDescending className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('order')}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                      sortBy === 'order' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <span>Order</span>
                    {sortBy === 'order' && (
                      sortOrder === 'asc' ? <HiSortAscending className="w-4 h-4" /> : <HiSortDescending className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subjects Table */}
        {filteredSubjects.length === 0 ? (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-12 text-center">
            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGraduationCap className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {subjects.length === 0 ? 'No subjects found' : 'No subjects match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {subjects.length === 0 
                ? 'Get started by creating your first subject' 
                : 'Try adjusting your search or filters'
              }
            </p>
            <Link
              href="/admin/subject/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all"
            >
              <HiPlus className="w-5 h-5" />
              <span>Create Subject</span>
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">All Subjects</h2>
              <div className="text-sm text-gray-400">
                Showing {filteredSubjects.length} of {subjects.length} subjects
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('order')}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <span>Order</span>
                        {sortBy === 'order' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <span>Subject</span>
                        {sortBy === 'name' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left text-gray-400">Exam</th>
                    <th className="py-4 px-6 text-left text-gray-400">Chapters</th>
                    <th className="py-4 px-6 text-left text-gray-400">Topics</th>
                    <th className="py-4 px-6 text-left text-gray-400">Formula Cards</th>
                    <th className="py-4 px-6 text-left text-gray-400">Created</th>
                    <th className="py-4 px-6 text-left text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <HiHashtag className="w-4 h-4 text-emerald-400" />
                          <span className="font-mono text-lg font-bold text-emerald-300">
                            {subject.order}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-white">{subject.name}</p>
                          <p className="text-sm text-gray-400 mt-1">/{subject.slug}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {subject.exams ? (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {subject.exams.name}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">No Exam</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <HiBookOpen className="w-4 h-4 text-purple-400" />
                          <span className="font-medium text-white">
                            {subject.chapters_count || 0}
                          </span>
                          <Link
                            href={`/admin/chapters?subject=${subject.id}`}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <HiCollection className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-white">
                            {subject.topics_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <HiAcademicCap className="w-4 h-4 text-cyan-400" />
                          <span className="font-medium text-white">
                            {subject.formula_cards_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-400">
                          {new Date(subject.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/subject/${subject.id}`}
                            className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Edit"
                          >
                            <HiPencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(subject.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Subject</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this subject? This action will remove all associated chapters, topics, and formula cards. This cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSubject(deleteConfirm)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}