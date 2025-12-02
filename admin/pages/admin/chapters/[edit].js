import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  HiArrowLeft, 
  HiCheck, 
  HiSave,
  HiSelector,
  HiHashtag,
  HiTrash,
  HiOutlineFolder,
  HiAcademicCap,
  HiOutlineBookOpen
} from 'react-icons/hi'
import { FaBook } from 'react-icons/fa'

export default function EditChapter() {
  const router = useRouter()
  const { edit: chapterId } = router.query

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [subjects, setSubjects] = useState([])

  const [formData, setFormData] = useState({
    subject_id: '',
    name: '',
    slug: '',
    order: 0
  })

  const [errors, setErrors] = useState({})
  const [slugAvailable, setSlugAvailable] = useState(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [stats, setStats] = useState({
    topics: 0,
    formulaCards: 0
  })

  useEffect(() => {
    if (chapterId) {
      checkUserAndFetchData()
    }
  }, [chapterId])

  useEffect(() => {
    if (formData.slug && formData.slug !== chapter?.slug) {
      checkSlugAvailability()
    }
  }, [formData.slug])

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
        fetchChapter()
      ])
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
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

  async function fetchChapter() {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select(`
          *,
          subjects:subject_id (*)
        `)
        .eq('id', chapterId)
        .single()

      if (error) throw error

      if (!data) {
        router.push('/admin/chapters')
        return
      }

      setChapter(data)
      setFormData({
        subject_id: data.subject_id || '',
        name: data.name || '',
        slug: data.slug || '',
        order: data.order || 0
      })

      // Get stats
      await fetchChapterStats(chapterId)
    } catch (error) {
      console.error('Error fetching chapter:', error)
      router.push('/admin/chapters')
    } finally {
      setLoading(false)
    }
  }

  async function fetchChapterStats(chapterId) {
    try {
      // Get topics count
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('id')
        .eq('chapter_id', chapterId)

      const topicsCount = topics?.length || 0

      // Get formula cards count
      let formulaCardsCount = 0
      if (topicsCount > 0) {
        const topicIds = topics.map(t => t.id)
        const { data: formulaCards, error: cardsError } = await supabase
          .from('formula_cards')
          .select('id')
          .in('topic_id', topicIds)
        
        formulaCardsCount = formulaCards?.length || 0
      }

      setStats({
        topics: topicsCount,
        formulaCards: formulaCardsCount
      })
    } catch (error) {
      console.error('Error fetching chapter stats:', error)
    }
  }

  const checkSlugAvailability = async () => {
    if (!formData.slug || formData.slug.length < 2) return
    
    setCheckingSlug(true)
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('slug')
        .eq('slug', formData.slug)
        .neq('id', chapterId) // Exclude current chapter
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

    if (!formData.subject_id) {
      newErrors.subject_id = 'Subject is required'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Chapter name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Chapter name must be at least 2 characters'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (formData.slug.length < 2) {
      newErrors.slug = 'Slug must be at least 2 characters'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    } else if (!slugAvailable && formData.slug !== chapter?.slug) {
      newErrors.slug = 'This slug is already taken'
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

    setSaving(true)

    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          subject_id: formData.subject_id,
          name: formData.name,
          slug: formData.slug,
          order: formData.order
        })
        .eq('id', chapterId)

      if (error) throw error

      alert('Chapter updated successfully!')
      router.push(`/admin/chapters${formData.subject_id ? `?subject=${formData.subject_id}` : ''}`)
    } catch (error) {
      console.error('Error updating chapter:', error)
      alert('Failed to update chapter')
    } finally {
      setSaving(false)
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

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${chapter?.name}"? This will also delete all associated topics and formula cards. This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId)

      if (error) throw error

      alert('Chapter deleted successfully!')
      router.push('/admin/chapters')
    } catch (error) {
      console.error('Error deleting chapter:', error)
      alert('Failed to delete chapter. Make sure it has no associated topics.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading chapter...</p>
        </div>
      </div>
    )
  }

  if (!chapter) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/chapters${chapter.subject_id ? `?subject=${chapter.subject_id}` : ''}`}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Edit Chapter
                </h1>
                <p className="text-gray-400 mt-2">Update chapter details and configuration</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>ID:</span>
                <span className="font-mono text-pink-300">{chapterId.substring(0, 8)}...</span>
              </div>
              <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-300">Role: </span>
                <span className="text-sm font-semibold text-pink-300 capitalize">{userRole}</span>
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
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject *
                  </label>
                  <div className="relative">
                    <select
                      name="subject_id"
                      value={formData.subject_id}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-900/50 border ${
                        errors.subject_id ? 'border-red-500/50' : 'border-gray-600'
                      } rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-10`}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.subject_id && (
                    <p className="mt-2 text-sm text-red-400">{errors.subject_id}</p>
                  )}
                </div>

                {/* Chapter Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chapter Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-900/50 border ${
                      errors.name ? 'border-red-500/50' : 'border-gray-600'
                    } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="e.g., Algebra, Calculus, Mechanics"
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL Slug *
                  </label>
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
                      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                      placeholder="algebra"
                      maxLength={50}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingSlug ? (
                        <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                      ) : slugAvailable === true || formData.slug === chapter.slug ? (
                        <div className="flex items-center space-x-1 text-purple-400">
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
                      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    />
                  </div>
                  {errors.order && (
                    <p className="mt-2 text-sm text-red-400">{errors.order}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-700 flex space-x-4">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={stats.topics > 0}
                    className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiTrash className="w-5 h-5" />
                    <span>
                      {stats.topics > 0 ? 'Cannot Delete (Has Topics)' : 'Delete Chapter'}
                    </span>
                  </button>
                  <button
                    type="submit"
                    disabled={saving || checkingSlug}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <HiSave className="w-5 h-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Info Section */}
          <div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 sticky top-8">
              {/* Chapter Info */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FaBook className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  {chapter.name}
                </h3>
                <p className="text-gray-400 text-sm text-center">
                  /{chapter.slug}
                </p>
              </div>

              {/* Stats */}
              <div className="mb-6 p-4 bg-gray-900/50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Content Statistics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <HiOutlineFolder className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">Topics</p>
                        <p className="text-xs text-gray-400">In this chapter</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-white">{stats.topics}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <HiAcademicCap className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">Formula Cards</p>
                        <p className="text-xs text-gray-400">Total in chapter</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-white">{stats.formulaCards}</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mb-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link
                    href={`/admin/topics?chapter=${chapterId}`}
                    className="block px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-blue-300">View Topics</span>
                      <HiArrowLeft className="w-4 h-4 text-blue-300 rotate-180" />
                    </div>
                  </Link>
                  <Link
                    href={`/admin/topics/new?chapter=${chapterId}`}
                    className="block px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300">Add New Topic</span>
                      <HiArrowLeft className="w-4 h-4 text-cyan-300 rotate-180" />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Chapter Metadata</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-300">
                      {new Date(chapter.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subject</span>
                    <span className="text-emerald-300">
                      {chapter.subjects?.name || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Order</span>
                    <span className="text-purple-300">#{chapter.order}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}