import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  HiPlus, HiPencil, HiTrash, HiEye, HiSearch,
  HiFilter, HiSortAscending, HiSortDescending,
  HiCollection, HiBookOpen, HiTag, HiRefresh,
  HiChevronDown, HiX
} from 'react-icons/hi'

export default function FormulaCardsList() {
  const router = useRouter()
  const [formulaCards, setFormulaCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [sortBy, setSortBy] = useState('order')
  const [sortOrder, setSortOrder] = useState('asc')
  
  // Dropdown data
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject)
    } else {
      setChapters([])
      setSelectedChapter('')
    }
  }, [selectedSubject])

  useEffect(() => {
    if (selectedChapter) {
      fetchTopics(selectedChapter)
    } else {
      setTopics([])
      setSelectedTopic('')
    }
  }, [selectedChapter])

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
        fetchFormulaCards(),
        fetchSubjects()
      ])
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  async function fetchFormulaCards() {
    setLoading(true)
    try {
      let query = supabase
        .from('formula_cards')
        .select(`
          *,
          chapters:chapter_id (id, name, subject:subject_id (id, name)),
          topics:topic_id (id, name)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,formula_text.ilike.%${searchTerm}%,tags.ilike.%${searchTerm}%`)
      }
      if (selectedChapter) {
        query = query.eq('chapter_id', selectedChapter)
      }
      if (selectedTopic) {
        query = query.eq('topic_id', selectedTopic)
      }

      const { data, error } = await query

      if (error) throw error
      setFormulaCards(data || [])
    } catch (error) {
      console.error('Error fetching formula cards:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('order')

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  async function fetchChapters(subjectId) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order')

      if (error) throw error
      setChapters(data || [])
    } catch (error) {
      console.error('Error fetching chapters:', error)
    }
  }

  async function fetchTopics(chapterId) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('order')

      if (error) throw error
      setTopics(data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  async function deleteFormulaCard(id) {
    try {
      const { error } = await supabase
        .from('formula_cards')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setFormulaCards(formulaCards.filter(card => card.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting formula card:', error)
      alert('Failed to delete formula card')
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
    setSelectedChapter('')
    setSelectedTopic('')
  }

  const filteredCards = formulaCards.filter(card => {
    if (!selectedSubject && !selectedChapter && !selectedTopic && !searchTerm) {
      return true
    }

    let matches = true
    if (selectedSubject && card.chapters?.subject?.id !== selectedSubject) {
      matches = false
    }
    if (selectedChapter && card.chapter_id !== selectedChapter) {
      matches = false
    }
    if (selectedTopic && card.topic_id !== selectedTopic) {
      matches = false
    }

    return matches
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading formula cards...</p>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Formula Cards
              </h1>
              <p className="text-gray-400 mt-2">Manage mathematical and scientific formula cards</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchFormulaCards}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
              >
                <HiRefresh className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <Link
                href="/admin/formulacards/new"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <HiPlus className="w-5 h-5" />
                <span>New Formula Card</span>
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
                <p className="text-gray-400 text-sm">Total Cards</p>
                <p className="text-3xl font-bold mt-2 text-white">{formulaCards.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <HiCollection className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Subjects</p>
                <p className="text-3xl font-bold mt-2 text-emerald-400">{subjects.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <HiBookOpen className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Chapters</p>
                <p className="text-3xl font-bold mt-2 text-purple-400">{chapters.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <HiBookOpen className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Your Role</p>
                <p className="text-2xl font-bold mt-2 capitalize text-cyan-300">{userRole}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <div className="text-xs font-bold text-cyan-300">FC</div>
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
                  placeholder="Search formula cards by title, formula, or tags..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-700">
              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chapter
                </label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  disabled={!selectedSubject}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Chapters</option>
                  {chapters.map(chapter => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={!selectedChapter}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Topics</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-700">
            <span className="text-sm text-gray-400">Sort by:</span>
            <button
              onClick={() => handleSort('title')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                sortBy === 'title' 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <span>Title</span>
              {sortBy === 'title' && (
                sortOrder === 'asc' ? <HiSortAscending className="w-4 h-4" /> : <HiSortDescending className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleSort('order')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                sortBy === 'order' 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <span>Order</span>
              {sortBy === 'order' && (
                sortOrder === 'asc' ? <HiSortAscending className="w-4 h-4" /> : <HiSortDescending className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleSort('created_at')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                sortBy === 'created_at' 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <span>Date Created</span>
              {sortBy === 'created_at' && (
                sortOrder === 'asc' ? <HiSortAscending className="w-4 h-4" /> : <HiSortDescending className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Formula Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-12 text-center">
            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiCollection className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {formulaCards.length === 0 ? 'No formula cards found' : 'No cards match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {formulaCards.length === 0 
                ? 'Get started by creating your first formula card' 
                : 'Try adjusting your search or filters'
              }
            </p>
            <Link
              href="/admin/formulacards/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all"
            >
              <HiPlus className="w-5 h-5" />
              <span>Create Formula Card</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredCards.map((card) => (
              <div key={card.id} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                {/* Card Image */}
                <div className="aspect-[4/5] bg-gray-900 relative overflow-hidden">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <HiCollection className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-gray-400">No Image</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                      <Link
                        href={`/admin/formulacards/edit/${card.id}`}
                        className="p-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <HiPencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(card.id)}
                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                        title="Delete"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                        {card.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm">
                        {card.chapters?.subject && (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                            {card.chapters.subject.name}
                          </span>
                        )}
                        {card.chapters && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            {card.chapters.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">#{card.order}</span>
                  </div>

                  {card.formula_text && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2 font-mono">
                      {card.formula_text}
                    </p>
                  )}

                  {card.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {card.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(card.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      {card.topics && (
                        <span className="text-cyan-400">
                          {card.topics.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Formula Card</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this formula card? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFormulaCard(deleteConfirm)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}