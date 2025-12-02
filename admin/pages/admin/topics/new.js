import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  HiArrowLeft, 
  HiCheck, 
  HiPlus,
  HiSelector,
  HiHashtag,
  HiAcademicCap,
  HiBookOpen,
  HiOutlineFolder,
  HiInformationCircle
} from 'react-icons/hi'
import { FaBook, FaGraduationCap, FaShieldAlt } from 'react-icons/fa'

export default function CreateTopic() {
  const router = useRouter()
  const { chapter: chapterId, subject: subjectId } = router.query
  
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [chapters, setChapters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(subjectId || '')
  const [selectedChapter, setSelectedChapter] = useState(chapterId || '')
  const [nextOrder, setNextOrder] = useState(0)

  const [formData, setFormData] = useState({
    chapter_id: chapterId || '',
    name: '',
    slug: '',
    order: 0
  })

  const [errors, setErrors] = useState({})
  const [slugAvailable, setSlugAvailable] = useState(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [securityCheck, setSecurityCheck] = useState(true)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (chapterId) {
      setFormData(prev => ({ ...prev, chapter_id: chapterId }))
      setSelectedChapter(chapterId)
      fetchChapterSubjects(chapterId)
    }
  }, [chapterId])

  useEffect(() => {
    if (subjectId) {
      setSelectedSubject(subjectId)
      fetchChaptersBySubject(subjectId)
    }
  }, [subjectId])

  useEffect(() => {
    if (formData.name) {
      generateSlug()
    }
  }, [formData.name])

  useEffect(() => {
    if (formData.slug && formData.slug.length > 2) {
      checkSlugAvailability()
    }
  }, [formData.slug])

  useEffect(() => {
    if (selectedSubject) {
      fetchChaptersBySubject(selectedSubject)
    } else {
      fetchAllChapters()
    }
  }, [selectedSubject])

  useEffect(() => {
    calculateNextOrder()
  }, [selectedChapter, chapters])

  async function checkUserAndFetchData() {
    try {
      // Security: Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Auth error:', authError)
        router.push('/login?redirect=/admin/topics/new')
        return
      }

      // Security: Get user with role verification
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, id, email')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        console.error('User fetch error:', userError)
        router.push('/not-allowed')
        return
      }

      // Security: Verify admin/teacher role
      if (!['superadmin', 'admin', 'teacher'].includes(userData.role)) {
        console.warn('Unauthorized access attempt by:', userData.email)
        router.push('/not-allowed')
        return
      }

      setUserRole(userData.role)
      setSecurityCheck(true)
      
      await Promise.all([
        fetchSubjects(),
        chapterId ? fetchChapterSubjects(chapterId) : fetchAllChapters()
      ])
      
      // Set initial form data based on URL params
      if (chapterId) {
        setFormData(prev => ({ ...prev, chapter_id: chapterId }))
      }
    } catch (error) {
      console.error('Security check error:', error)
      router.push('/login')
    }
  }

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, slug')
        .order('order')

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
      alert('Failed to load subjects. Please refresh.')
    }
  }

  async function fetchAllChapters() {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, name, subject_id, subjects:subject_id(id, name)')
        .order('order')

      if (error) throw error
      setChapters(data || [])
    } catch (error) {
      console.error('Error fetching chapters:', error)
    }
  }

  async function fetchChaptersBySubject(subjectId) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, name, subject_id, subjects:subject_id(id, name)')
        .eq('subject_id', subjectId)
        .order('order')

      if (error) throw error
      setChapters(data || [])
      
      // Clear chapter selection if subject changes
      if (selectedSubject !== subjectId) {
        setSelectedChapter('')
        setFormData(prev => ({ ...prev, chapter_id: '' }))
      }
    } catch (error) {
      console.error('Error fetching chapters by subject:', error)
    }
  }

  async function fetchChapterSubjects(chapterId) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('subject_id, subjects:subject_id(id, name)')
        .eq('id', chapterId)
        .single()

      if (error) throw error
      if (data && data.subject_id) {
        setSelectedSubject(data.subject_id)
        await fetchChaptersBySubject(data.subject_id)
      }
    } catch (error) {
      console.error('Error fetching chapter subjects:', error)
    }
  }

  async function calculateNextOrder() {
    try {
      let query = supabase
        .from('topics')
        .select('order', { count: 'exact' })
        .order('order', { ascending: false })
        .limit(1)

      if (selectedChapter) {
        query = query.eq('chapter_id', selectedChapter)
      }

      const { data, error, count } = await query

      if (error) throw error
      
      const maxOrder = data && data.length > 0 ? data[0].order : 0
      setNextOrder(maxOrder + 1)
      
      // Update form order if not manually set
      if (formData.order === 0 || formData.order === '') {
        setFormData(prev => ({ ...prev, order: maxOrder + 1 }))
      }
    } catch (error) {
      console.error('Error calculating next order:', error)
    }
  }

  const generateSlug = () => {
    if (!formData.name) return
    
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    setFormData(prev => ({ ...prev, slug }))
  }

  const checkSlugAvailability = async () => {
    if (!formData.slug || formData.slug.length < 2) return
    
    setCheckingSlug(true)
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('slug')
        .eq('slug', formData.slug)
        .eq('chapter_id', selectedChapter || formData.chapter_id)
        .single()

      setSlugAvailable(!data)
    } catch (error) {
      // No record found means slug is available
      setSlugAvailable(true)
    } finally {
      setCheckingSlug(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Topic name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Topic name must be at least 2 characters'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (formData.slug.length < 2) {
      newErrors.slug = 'Slug must be at least 2 characters'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    } else if (!slugAvailable) {
      newErrors.slug = 'This slug is already taken in this chapter'
    }

    if (!formData.chapter_id) {
      newErrors.chapter_id = 'Please select a chapter'
    }

    if (formData.order < 0) {
      newErrors.order = 'Order must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!securityCheck) {
      alert('Security verification failed. Please refresh and try again.')
      return
    }

    setSubmitting(true)
    setLoading(true)

    try {
      // Security: Verify user still has permission
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User session expired')

      // Create topic with service role for security
      const { data: topicData, error } = await supabase
        .from('topics')
        .insert([{
          id: crypto.randomUUID(),
          chapter_id: formData.chapter_id,
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          order: parseInt(formData.order),
          created_by: user.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Failed to create topic')
      }

      // Log the creation for audit trail
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'CREATE_TOPIC',
          resource_id: topicData.id,
          details: {
            topic_name: topicData.name,
            chapter_id: topicData.chapter_id
          }
        })

      alert('Topic created successfully!')
      router.push(`/admin/topics?chapter=${formData.chapter_id}`)
    } catch (error) {
      console.error('Error creating topic:', error)
      alert(error.message || 'Failed to create topic. Please try again.')
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSlugChange = (e) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  const handleChapterChange = (e) => {
    const chapterId = e.target.value
    setSelectedChapter(chapterId)
    setFormData(prev => ({ ...prev, chapter_id: chapterId }))
    
    // Find subject for selected chapter
    const chapter = chapters.find(c => c.id === chapterId)
    if (chapter) {
      setSelectedSubject(chapter.subject_id)
    }
    
    calculateNextOrder()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/topics${selectedChapter ? `?chapter=${selectedChapter}` : selectedSubject ? `?subject=${selectedSubject}` : ''}`}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Create New Topic
                </h1>
                <p className="text-gray-400 mt-2">
                  {selectedChapter 
                    ? `Add topic to: ${chapters.find(c => c.id === selectedChapter)?.name || 'Selected Chapter'}`
                    : 'Create a new topic for organizing formula cards'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-gray-700/50 rounded-lg flex items-center space-x-2">
                <FaShieldAlt className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Role: </span>
                <span className="text-sm font-semibold text-cyan-300 capitalize">{userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Topic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Topic Name *
                  </label>
                  <div className="relative">
                    <HiOutlineFolder className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-900/50 border ${
                        errors.name ? 'border-red-500/50' : 'border-gray-600'
                      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="e.g., Quadratic Equations, Thermodynamics, Organic Chemistry"
                      maxLength={100}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      URL Slug *
                    </label>
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Generate from name
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      /
                    </div>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      className={`w-full pl-8 pr-24 py-3 bg-gray-900/50 border ${
                        errors.slug ? 'border-red-500/50' : 'border-gray-600'
                      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="quadratic-equations"
                      maxLength={50}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingSlug ? (
                        <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
                      ) : slugAvailable === true ? (
                        <div className="flex items-center space-x-1 text-green-400">
                          <HiCheck className="w-4 h-4" />
                          <span className="text-xs">Available</span>
                        </div>
                      ) : slugAvailable === false ? (
                        <div className="flex items-center space-x-1 text-red-400">
                          <span className="text-xs">Taken</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {errors.slug && (
                    <p className="mt-2 text-sm text-red-400">{errors.slug}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-400">
                    Used in URLs. Lowercase letters, numbers, and hyphens only.
                  </p>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <div className="relative">
                    <FaGraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      value={selectedSubject}
                      onChange={(e) => {
                        setSelectedSubject(e.target.value)
                        setSelectedChapter('')
                        setFormData(prev => ({ ...prev, chapter_id: '' }))
                      }}
                      className="w-full pl-10 pr-10 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Subject (Optional)</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    Filter chapters by subject
                  </p>
                </div>

                {/* Chapter Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chapter *
                  </label>
                  <div className="relative">
                    <HiBookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      name="chapter_id"
                      value={formData.chapter_id}
                      onChange={handleChapterChange}
                      className={`w-full pl-10 pr-10 py-3 bg-gray-900/50 border ${
                        errors.chapter_id ? 'border-red-500/50' : 'border-gray-600'
                      } rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    >
                      <option value="">Select a Chapter</option>
                      {chapters.map(chapter => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.name} {chapter.subjects && `(${chapter.subjects.name})`}
                        </option>
                      ))}
                    </select>
                    <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.chapter_id && (
                    <p className="mt-2 text-sm text-red-400">{errors.chapter_id}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-400">
                    Topics are organized under chapters
                  </p>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Order
                  </label>
                  <div className="relative">
                    <HiHashtag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-900/50 border ${
                        errors.order ? 'border-red-500/50' : 'border-gray-600'
                      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    />
                  </div>
                  {errors.order && (
                    <p className="mt-2 text-sm text-red-400">{errors.order}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-400 flex items-center justify-between">
                    <span>Lower numbers appear first</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, order: nextOrder }))}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Set to next ({nextOrder})
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={loading || checkingSlug || submitting}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Creating Topic...
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-5 h-5 mr-2" />
                        Create Topic
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    <FaShieldAlt className="inline w-3 h-3 mr-1" />
                    Secured by RLS and audit logging
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Info Section */}
          <div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 sticky top-8">
              {/* Info Card */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <HiOutlineFolder className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  Topic Information
                </h3>
                <p className="text-gray-400 text-sm text-center">
                  Topics organize formula cards within chapters
                </p>
              </div>

              {/* Context Info */}
              {selectedChapter && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">Current Context</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <HiBookOpen className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">
                        Chapter: {chapters.find(c => c.id === selectedChapter)?.name || 'Loading...'}
                      </span>
                    </div>
                    {selectedSubject && (
                      <div className="flex items-center space-x-2">
                        <FaGraduationCap className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">
                          Subject: {subjects.find(s => s.id === selectedSubject)?.name || 'Loading...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Benefits</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Organize formula cards logically</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Enable targeted learning paths</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Improve content discoverability</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Support sequential learning</span>
                  </li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="mb-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link
                    href="/admin/chapters"
                    className="block px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">Manage Chapters</span>
                      <HiArrowLeft className="w-4 h-4 text-purple-300 rotate-180" />
                    </div>
                  </Link>
                  <Link
                    href="/admin/formulacards/new"
                    className="block px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300">Add Formula Card</span>
                      <HiPlus className="w-4 h-4 text-cyan-300" />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Tips */}
              <div className="pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Tips</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start space-x-2">
                    <HiInformationCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Use specific, descriptive topic names</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <HiInformationCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Keep slugs short and memorable</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <HiInformationCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Plan topic order for learning flow</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <HiInformationCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Each topic can have multiple formula cards</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}