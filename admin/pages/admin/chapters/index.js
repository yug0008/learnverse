import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  HiPlus, HiPencil, HiTrash, HiBookOpen,
  HiSearch, HiFilter, HiSortAscending, 
  HiSortDescending, HiRefresh, HiX,
  HiChevronDown, HiCollection, HiAcademicCap,
  HiHashtag, HiOutlineFolder, HiOutlineBookOpen
} from 'react-icons/hi'
import { FaGraduationCap, FaBook } from 'react-icons/fa'

export default function ChaptersList() {
  const router = useRouter()
  const { subject: subjectId } = router.query

  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  // Stats
  const [stats, setStats] = useState({
    totalChapters: 0,
    totalTopics: 0,
    totalFormulaCards: 0
  })
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('order')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedSubject, setSelectedSubject] = useState(subjectId || '')
  const [subjects, setSubjects] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentSubject, setCurrentSubject] = useState(null)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (subjectId) {
      setSelectedSubject(subjectId)
      fetchSubjectDetails(subjectId)
    }
  }, [subjectId])

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
        fetchChapters()
      ])
      await fetchStats()
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  async function fetchSubjectDetails(subjectId) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single()

      if (error) throw error
      setCurrentSubject(data)
    } catch (error) {
      console.error('Error fetching subject details:', error)
    }
  }

  async function fetchChapters() {
    setLoading(true)
    try {
      let query = supabase
        .from('chapters')
        .select(`
          *,
          subjects:subject_id (id, name, slug)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
      }
      if (selectedSubject) {
        query = query.eq('subject_id', selectedSubject)
      }

      const { data: chaptersData, error } = await query

      if (error) throw error

      // Get counts for each chapter
      const chaptersWithCounts = await Promise.all(
        chaptersData.map(async (chapter) => {
          try {
            // Get topics for this chapter
            const { data: topics, error: topicsError } = await supabase
              .from('topics')
              .select('id')
              .eq('chapter_id', chapter.id)

            const topicsCount = topics?.length || 0

            // Get formula cards for this chapter (through topics)
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
              ...chapter,
              topics_count: topicsCount,
              formula_cards_count: formulaCardsCount
            }
          } catch (error) {
            console.error(`Error fetching counts for chapter ${chapter.id}:`, error)
            return {
              ...chapter,
              topics_count: 0,
              formula_cards_count: 0
            }
          }
        })
      )

      setChapters(chaptersWithCounts)
    } catch (error) {
      console.error('Error fetching chapters:', error)
      setChapters([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name')

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  async function fetchStats() {
    try {
      // Get counts
      const [
        { count: chaptersCount },
        { count: topicsCount },
        { count: formulaCardsCount }
      ] = await Promise.all([
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('topics').select('*', { count: 'exact', head: true }),
        supabase.from('formula_cards').select('*', { count: 'exact', head: true })
      ])

      setStats({
        totalChapters: chaptersCount || 0,
        totalTopics: topicsCount || 0,
        totalFormulaCards: formulaCardsCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function deleteChapter(id) {
    try {
      // First check if chapter has topics
      const { data: topics } = await supabase
        .from('topics')
        .select('id')
        .eq('chapter_id', id)
        .limit(1)

      if (topics && topics.length > 0) {
        alert('Cannot delete chapter that has topics. Please delete all topics first.')
        return
      }

      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setChapters(chapters.filter(chapter => chapter.id !== id))
      setDeleteConfirm(null)
      await Promise.all([fetchStats(), fetchChapters()])
    } catch (error) {
      console.error('Error deleting chapter:', error)
      alert('Failed to delete chapter. Make sure it has no associated topics.')
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
    setSelectedSubject('')
    setCurrentSubject(null)
    if (subjectId) {
      router.push('/admin/chapters')
    }
  }

  const filteredChapters = chapters.filter(chapter => {
    if (!searchTerm && !selectedSubject) return true
    
    let matches = true
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      matches = chapter.name.toLowerCase().includes(searchLower) || 
                chapter.slug.toLowerCase().includes(searchLower)
    }
    if (selectedSubject && chapter.subject_id !== selectedSubject) {
      matches = false
    }
    
    return matches
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading chapters...</p>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Chapters Management
              </h1>
              <p className="text-gray-400 mt-2">
                {currentSubject 
                  ? `Managing chapters for: ${currentSubject.name}`
                  : 'Organize chapters by subjects and manage topics'
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => Promise.all([fetchChapters(), fetchStats()])}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
              >
                <HiRefresh className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <Link
                href={`/admin/chapters/new${selectedSubject ? `?subject=${selectedSubject}` : ''}`}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <HiPlus className="w-5 h-5" />
                <span>New Chapter</span>
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
                <p className="text-gray-400 text-sm">Total Chapters</p>
                <p className="text-3xl font-bold mt-2 text-white">{stats.totalChapters}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Active</span>
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
                  <span className="text-xs text-gray-400">Across all chapters</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <HiOutlineFolder className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Formula Cards</p>
                <p className="text-3xl font-bold mt-2 text-cyan-400">{stats.totalFormulaCards}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <span className="text-xs text-gray-400">Total cards</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <HiAcademicCap className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Your Role</p>
                <p className="text-2xl font-bold mt-2 capitalize text-pink-300">{userRole}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Active</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <div className="text-xs font-bold text-pink-300">CH</div>
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
                  placeholder="Search chapters by name or slug..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value)
                    if (e.target.value) {
                      fetchSubjectDetails(e.target.value)
                    } else {
                      setCurrentSubject(null)
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
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
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
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
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
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

          {/* Subject Info Banner */}
          {currentSubject && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FaBook className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{currentSubject.name}</h3>
                    <p className="text-sm text-purple-300">/{currentSubject.slug}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Order: <span className="font-bold text-white">#{currentSubject.order}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chapters Table */}
        {filteredChapters.length === 0 ? (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-12 text-center">
            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiBookOpen className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {chapters.length === 0 ? 'No chapters found' : 'No chapters match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {chapters.length === 0 
                ? 'Get started by creating your first chapter' 
                : 'Try adjusting your search or filters'
              }
            </p>
            <Link
              href={`/admin/chapters/new${selectedSubject ? `?subject=${selectedSubject}` : ''}`}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
            >
              <HiPlus className="w-5 h-5" />
              <span>Create Chapter</span>
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedSubject ? `Chapters in ${currentSubject?.name || 'Subject'}` : 'All Chapters'}
              </h2>
              <div className="text-sm text-gray-400">
                Showing {filteredChapters.length} of {chapters.length} chapters
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
                        <span>Chapter</span>
                        {sortBy === 'name' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left text-gray-400">Subject</th>
                    <th className="py-4 px-6 text-left text-gray-400">Topics</th>
                    <th className="py-4 px-6 text-left text-gray-400">Formula Cards</th>
                    <th className="py-4 px-6 text-left text-gray-400">Created</th>
                    <th className="py-4 px-6 text-left text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredChapters.map((chapter) => (
                    <tr key={chapter.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <HiHashtag className="w-4 h-4 text-purple-400" />
                          <span className="font-mono text-lg font-bold text-purple-300">
                            {chapter.order}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-white">{chapter.name}</p>
                          <p className="text-sm text-gray-400 mt-1">/{chapter.slug}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {chapter.subjects ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm text-emerald-300">
                              {chapter.subjects.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No Subject</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <HiOutlineFolder className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-white">
                            {chapter.topics_count || 0}
                          </span>
                          <Link
                            href={`/admin/topics?chapter=${chapter.id}`}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <HiAcademicCap className="w-4 h-4 text-cyan-400" />
                          <span className="font-medium text-white">
                            {chapter.formula_cards_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-400">
                          {new Date(chapter.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/chapters/${chapter.id}`}
                            className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 transition-colors"
                            title="Edit"
                          >
                            <HiPencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(chapter.id)}
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
            <h3 className="text-xl font-semibold text-white mb-4">Delete Chapter</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this chapter? This action will remove all associated topics and formula cards. This cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteChapter(deleteConfirm)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
              >
                Delete Chapter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}