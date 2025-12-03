import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  HiSearch, HiFilter, HiPlus, HiTrash, HiPencil,
  HiAcademicCap, HiOutlineQuestionMarkCircle,
  HiHashtag, HiRefresh, HiX, HiChevronDown,
  HiSelector, HiBookOpen, HiFolder, HiTag
} from 'react-icons/hi'
import { FaGraduationCap, FaShieldAlt } from 'react-icons/fa'

export default function QuestionsList() {
  const router = useRouter()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  // Data for filters
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pyq: 0,
    dpp: 0,
    objective: 0,
    numerical: 0
  })

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (selectedExam) {
      fetchSubjectsByExam(selectedExam)
    } else {
      fetchAllSubjects()
    }
  }, [selectedExam])

  useEffect(() => {
    if (selectedSubject) {
      fetchChaptersBySubject(selectedSubject)
    } else {
      setChapters([])
    }
  }, [selectedSubject])

  useEffect(() => {
    if (selectedChapter) {
      fetchTopicsByChapter(selectedChapter)
    } else {
      setTopics([])
    }
  }, [selectedChapter])

  async function checkUserAndFetchData() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/login?redirect=/admin/questions')
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userError || !userData || !['superadmin', 'admin', 'teacher'].includes(userData.role)) {
        router.push('/not-allowed')
        return
      }

      setUserRole(userData.role)
      await Promise.all([
        fetchExams(),
        fetchAllSubjects(),
        fetchQuestions(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  async function fetchExams() {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, name, slug')
        .order('name')

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  async function fetchAllSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, slug, exam_id')
        .order('name')

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  async function fetchSubjectsByExam(examId) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, slug, exam_id')
        .eq('exam_id', examId)
        .order('name')

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects by exam:', error)
    }
  }

  async function fetchChaptersBySubject(subjectId) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, name, slug, subject_id')
        .eq('subject_id', subjectId)
        .order('order')

      if (error) throw error
      setChapters(data || [])
    } catch (error) {
      console.error('Error fetching chapters:', error)
    }
  }

  async function fetchTopicsByChapter(chapterId) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name, slug, chapter_id')
        .eq('chapter_id', chapterId)
        .order('order')

      if (error) throw error
      setTopics(data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  async function fetchQuestions() {
    setLoading(true)
    try {
      let query = supabase
        .from('questions')
        .select(`
          *,
          exams:exam_id (id, name, slug),
          subjects:subject_id (id, name, slug),
          chapters:chapter_id (id, name, slug),
          topics:topic_id (id, name, slug)
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%,question_blocks->0->>'content'.ilike.%${searchTerm}%`)
      }
      if (selectedExam) query = query.eq('exam_id', selectedExam)
      if (selectedSubject) query = query.eq('subject_id', selectedSubject)
      if (selectedChapter) query = query.eq('chapter_id', selectedChapter)
      if (selectedTopic) query = query.eq('topic_id', selectedTopic)
      if (selectedType) query = query.eq('question_type', selectedType)
      if (selectedCategory) query = query.eq('category', selectedCategory)
      if (selectedDifficulty) query = query.eq('difficulty_category', selectedDifficulty)

      const { data, error } = await query

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const [
        { count: totalCount },
        { count: pyqCount },
        { count: dppCount },
        { count: objectiveCount },
        { count: numericalCount }
      ] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('category', 'PYQ'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('category', 'DPP'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('question_type', 'objective'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('question_type', 'numerical')
      ])

      setStats({
        total: totalCount || 0,
        pyq: pyqCount || 0,
        dpp: dppCount || 0,
        objective: objectiveCount || 0,
        numerical: numericalCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function deleteQuestion(id) {
    try {
      setSubmitting(true)
      
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setQuestions(questions.filter(q => q.id !== id))
      setDeleteConfirm(null)
      await fetchStats()
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Failed to delete question. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedExam('')
    setSelectedSubject('')
    setSelectedChapter('')
    setSelectedTopic('')
    setSelectedType('')
    setSelectedCategory('')
    setSelectedDifficulty('')
  }

  const filteredQuestions = questions.filter(q => {
    if (!searchTerm && !selectedExam && !selectedSubject && !selectedChapter && 
        !selectedTopic && !selectedType && !selectedCategory && !selectedDifficulty) {
      return true
    }
    
    let matches = true
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const questionText = JSON.stringify(q.question_blocks || '').toLowerCase()
      matches = questionText.includes(searchLower) || q.id.toLowerCase().includes(searchLower)
    }
    
    if (selectedExam && q.exam_id !== selectedExam) matches = false
    if (selectedSubject && q.subject_id !== selectedSubject) matches = false
    if (selectedChapter && q.chapter_id !== selectedChapter) matches = false
    if (selectedTopic && q.topic_id !== selectedTopic) matches = false
    if (selectedType && q.question_type !== selectedType) matches = false
    if (selectedCategory && q.category !== selectedCategory) matches = false
    if (selectedDifficulty && q.difficulty_category !== selectedDifficulty) matches = false
    
    return matches
  })

  const difficultyColors = {
    'High Output High Input': 'bg-red-500/20 text-red-400 border-red-500/30',
    'High Output Low Input': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Low Output Low Input': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Low Output High Input': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  const categoryColors = {
    'PYQ': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'DPP': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  }

  const typeColors = {
    'objective': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'numerical': 'bg-pink-500/20 text-pink-400 border-pink-500/30'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading questions...</p>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Questions Management
              </h1>
              <p className="text-gray-400 mt-2">
                Manage all questions with LaTeX, images, and rich content support
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => Promise.all([fetchQuestions(), fetchStats()])}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
              >
                <HiRefresh className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <Link
                href="/admin/questions/new"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <HiPlus className="w-5 h-5" />
                <span>New Question</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Questions</p>
                <p className="text-3xl font-bold mt-2 text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <HiOutlineQuestionMarkCircle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">PYQ Questions</p>
                <p className="text-3xl font-bold mt-2 text-purple-400">{stats.pyq}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <HiAcademicCap className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">DPP Questions</p>
                <p className="text-3xl font-bold mt-2 text-cyan-400">{stats.dpp}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <HiBookOpen className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Objective</p>
                <p className="text-3xl font-bold mt-2 text-indigo-400">{stats.objective}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <HiSelector className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Numerical</p>
                <p className="text-3xl font-bold mt-2 text-pink-400">{stats.numerical}</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <HiHashtag className="w-6 h-6 text-pink-400" />
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
                  placeholder="Search questions by content or ID..."
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
                <HiChevronDown className={`w-5 h-5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-700">
              {/* Exam Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exam
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => {
                    setSelectedExam(e.target.value)
                    setSelectedSubject('')
                    setSelectedChapter('')
                    setSelectedTopic('')
                  }}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Exams</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value)
                    setSelectedChapter('')
                    setSelectedTopic('')
                  }}
                  disabled={!selectedExam && subjects.length === 0}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
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
                  onChange={(e) => {
                    setSelectedChapter(e.target.value)
                    setSelectedTopic('')
                  }}
                  disabled={!selectedSubject}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                >
                  <option value="">All Chapters</option>
                  {chapters.map(chapter => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Question Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Types</option>
                  <option value="objective">Objective</option>
                  <option value="numerical">Numerical</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Categories</option>
                  <option value="PYQ">PYQ</option>
                  <option value="DPP">DPP</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Difficulties</option>
                  <option value="High Output High Input">High Output High Input</option>
                  <option value="High Output Low Input">High Output Low Input</option>
                  <option value="Low Output Low Input">Low Output Low Input</option>
                  <option value="Low Output High Input">Low Output High Input</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Questions Table */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-12 text-center">
            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineQuestionMarkCircle className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {questions.length === 0 ? 'No questions found' : 'No questions match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {questions.length === 0 
                ? 'Get started by creating your first question' 
                : 'Try adjusting your search or filters'
              }
            </p>
            <Link
              href="/admin/questions/new"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              <HiPlus className="w-5 h-5" />
              <span>Create Question</span>
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">
                Questions ({filteredQuestions.length} of {questions.length})
              </h2>
              <div className="text-sm text-gray-400">
                Showing {filteredQuestions.length} questions
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-4 px-6 text-left text-gray-400">ID</th>
                    <th className="py-4 px-6 text-left text-gray-400">Question</th>
                    <th className="py-4 px-6 text-left text-gray-400">Type</th>
                    <th className="py-4 px-6 text-left text-gray-400">Category</th>
                    <th className="py-4 px-6 text-left text-gray-400">Difficulty</th>
                    <th className="py-4 px-6 text-left text-gray-400">Created</th>
                    <th className="py-4 px-6 text-left text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredQuestions.map((question) => {
                    // Parse question content for preview
                    let preview = ''
                    try {
                      const blocks = JSON.parse(question.question_blocks)
                      if (Array.isArray(blocks) && blocks[0]?.content) {
                        preview = blocks[0].content.substring(0, 80) + (blocks[0].content.length > 80 ? '...' : '')
                      }
                    } catch {
                      preview = String(question.question_blocks).substring(0, 80) + '...'
                    }
                    
                    return (
                      <tr key={question.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="text-xs text-gray-400 font-mono">
                            {question.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-md">
                            <div className="text-white text-sm mb-1 truncate">
                              {preview}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              {question.exams && (
                                <span className="flex items-center space-x-1">
                                  <FaGraduationCap className="w-3 h-3" />
                                  <span>{question.exams.name}</span>
                                </span>
                              )}
                              {question.subjects && (
                                <span className="flex items-center space-x-1">
                                  <HiBookOpen className="w-3 h-3" />
                                  <span>{question.subjects.name}</span>
                                </span>
                              )}
                              {question.chapters && (
                                <span className="flex items-center space-x-1">
                                  <HiFolder className="w-3 h-3" />
                                  <span>{question.chapters.name}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[question.question_type]}`}>
                            {question.question_type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[question.category]}`}>
                            {question.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColors[question.difficulty_category]}`}>
                            {question.difficulty_category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-400">
                            {new Date(question.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/admin/questions/${question.id}`}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                              title="Edit"
                            >
                              <HiPencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteConfirm(question.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                              title="Delete"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
            <h3 className="text-xl font-semibold text-white mb-4">Delete Question</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this question? This action cannot be undone and will remove all associated user attempts.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteQuestion(deleteConfirm)}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <HiTrash className="w-4 h-4" />
                    <span>Delete Question</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}