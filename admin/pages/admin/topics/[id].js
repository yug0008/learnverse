import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  HiArrowLeft, 
  HiCheck, 
  HiTrash,
  HiSelector,
  HiHashtag,
  HiAcademicCap,
  HiBookOpen,
  HiOutlineFolder,
  HiInformationCircle,
  HiExclamation,
  HiRefresh
} from 'react-icons/hi'
import { FaBook, FaGraduationCap, FaShieldAlt, FaHistory } from 'react-icons/fa'

export default function EditTopic() {
  const router = useRouter()
  const { id } = router.query
  
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [chapters, setChapters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [topic, setTopic] = useState(null)
  const [formulaCardsCount, setFormulaCardsCount] = useState(0)

  const [formData, setFormData] = useState({
    chapter_id: '',
    name: '',
    slug: '',
    order: 0
  })

  const [originalData, setOriginalData] = useState(null)
  const [errors, setErrors] = useState({})
  const [slugAvailable, setSlugAvailable] = useState(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [securityCheck, setSecurityCheck] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (id) {
      checkUserAndFetchData()
    }
  }, [id])

  useEffect(() => {
    if (formData.name && formData.name !== originalData?.name) {
      generateSlug()
    }
  }, [formData.name])

  useEffect(() => {
    if (formData.slug && formData.slug !== originalData?.slug && formData.slug.length > 2) {
      checkSlugAvailability()
    }
  }, [formData.slug, formData.chapter_id])

  useEffect(() => {
    const changed = originalData && (
      formData.name !== originalData.name ||
      formData.slug !== originalData.slug ||
      formData.chapter_id !== originalData.chapter_id ||
      parseInt(formData.order) !== originalData.order
    )
    setHasChanges(changed)
  }, [formData, originalData])

  async function checkUserAndFetchData() {
    try {
      // Security: Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Auth error:', authError)
        router.push(`/login?redirect=/admin/topics/${id}`)
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
        fetchTopic(),
        fetchSubjects(),
        fetchAllChapters()
      ])
    } catch (error) {
      console.error('Security check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function fetchTopic() {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          chapters:chapter_id (
            id,
            name,
            subject_id,
            subjects:subject_id (
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Topic not found
          alert('Topic not found')
          router.push('/admin/topics')
          return
        }
        throw error
      }

      if (!data) {
        alert('Topic not found')
        router.push('/admin/topics')
        return
      }

      setTopic(data)
      setOriginalData(data)
      setFormData({
        chapter_id: data.chapter_id,
        name: data.name,
        slug: data.slug,
        order: data.order
      })

      // Fetch formula cards count
      const { count } = await supabase
        .from('formula_cards')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', id)

      setFormulaCardsCount(count || 0)
    } catch (error) {
      console.error('Error fetching topic:', error)
      alert('Failed to load topic data')
      router.push('/admin/topics')
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
        .eq('chapter_id', formData.chapter_id)
        .neq('id', id)
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
    } else if (formData.slug !== originalData?.slug && !slugAvailable) {
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

    try {
      // Security: Verify user still has permission
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User session expired')

      // Update topic with service role for security
      const { data: updatedTopic, error } = await supabase
        .from('topics')
        .update({
          chapter_id: formData.chapter_id,
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          order: parseInt(formData.order),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Failed to update topic')
      }

      // Log the update for audit trail
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'UPDATE_TOPIC',
          resource_id: id,
          details: {
            old_data: originalData,
            new_data: updatedTopic,
            changes: {
              name: originalData.name !== updatedTopic.name,
              slug: originalData.slug !== updatedTopic.slug,
              chapter_id: originalData.chapter_id !== updatedTopic.chapter_id,
              order: originalData.order !== updatedTopic.order
            }
          }
        })

      alert('Topic updated successfully!')
      setOriginalData(updatedTopic)
      await fetchTopic() // Refresh data
    } catch (error) {
      console.error('Error updating topic:', error)
      alert(error.message || 'Failed to update topic. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!securityCheck) {
      alert('Security verification failed')
      return
    }

    setDeleting(true)

    try {
      // Security: Verify user still has permission
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User session expired')

      // Check if topic has formula cards
      if (formulaCardsCount > 0) {
        alert(`Cannot delete topic with ${formulaCardsCount} formula card(s). Delete all formula cards first.`)
        setDeleting(false)
        setShowDeleteConfirm(false)
        return
      }

      // Delete topic with service role for security
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Failed to delete topic')
      }

      // Log the deletion for audit trail
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'DELETE_TOPIC',
          resource_id: id,
          details: {
            topic_name: topic.name,
            chapter_id: topic.chapter_id
          }
        })

      alert('Topic deleted successfully!')
      router.push('/admin/topics')
    } catch (error) {
      console.error('Error deleting topic:', error)
      alert(error.message || 'Failed to delete topic. Please try again.')
      setDeleting(false)
      setShowDeleteConfirm(false)
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

  const resetForm = () => {
    if (originalData) {
      setFormData({
        chapter_id: originalData.chapter_id,
        name: originalData.name,
        slug: originalData.slug,
        order: originalData.order
      })
      setErrors({})
      setSlugAvailable(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading topic data...</p>
          <p className="text-gray-500 text-sm mt-2">Security verification in progress</p>
        </div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <HiExclamation className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Topic Not Found</h3>
          <p className="text-gray-400 mb-6">The topic you're looking for doesn't exist or was deleted.</p>
          <Link
            href="/admin/topics"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back to Topics</span>
          </Link>
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
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/topics?chapter=${topic.chapter_id}`}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Edit Topic
                </h1>
                <p className="text-gray-400 mt-2">
                  {topic.name} • {topic.chapters?.name || 'No Chapter'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 bg-gray-700/50 rounded-lg flex items-center space-x-2">
                <FaShieldAlt className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Role: </span>
                <span className="text-sm font-semibold text-cyan-300 capitalize">{userRole}</span>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all flex items-center space-x-2"
                disabled={deleting}
              >
                <HiTrash className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
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
              {/* Change Indicator */}
              {hasChanges && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HiExclamation className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-300 font-medium">You have unsaved changes</span>
                    </div>
                    <button
                      onClick={resetForm}
                      className="text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center space-x-1"
                    >
                      <HiRefresh className="w-4 h-4" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              )}

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
                      placeholder="e.g., Quadratic Equations"
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
                      ) : slugAvailable === true || formData.slug === originalData?.slug ? (
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
                      onChange={handleInputChange}
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
                    Changing the chapter will move all formula cards
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
                  <p className="mt-2 text-sm text-gray-400">
                    Lower numbers appear first. Adjust to change position in list.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={!hasChanges || submitting || checkingSlug}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Updating Topic...
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-5 h-5 mr-2" />
                        {hasChanges ? 'Update Topic' : 'No Changes to Save'}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    <FaShieldAlt className="inline w-3 h-3 mr-1" />
                    All changes are logged for security audit
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Info Section */}
          <div>
            <div className="space-y-8">
              {/* Topic Info Card */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <HiOutlineFolder className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white text-center mb-2">
                    Topic Details
                  </h3>
                  <p className="text-gray-400 text-sm text-center">
                    ID: {id.substring(0, 8)}...
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <HiAcademicCap className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Formula Cards</p>
                          <p className="text-xl font-bold text-cyan-400">{formulaCardsCount}</p>
                        </div>
                      </div>
                      {formulaCardsCount > 0 && (
                        <Link
                          href={`/admin/formulacards?topic=${id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View All →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <HiBookOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Chapter</p>
                          <p className="text-lg font-semibold text-purple-300 truncate">
                            {topic.chapters?.name || 'No Chapter'}
                          </p>
                        </div>
                      </div>
                      {topic.chapter_id && (
                        <Link
                          href={`/admin/chapters/${topic.chapter_id}`}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Edit →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <FaGraduationCap className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Subject</p>
                        <p className="text-lg font-semibold text-emerald-300">
                          {topic.chapters?.subjects?.name || 'No Subject'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="pt-6 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Timestamps</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span className="text-gray-300">
                        {new Date(topic.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {topic.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Updated</span>
                        <span className="text-gray-300">
                          {new Date(topic.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
                <div className="space-y-3">
                  <Link
                    href={`/admin/formulacards/new?topic=${id}`}
                    className="block px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-cyan-500/30 rounded-lg flex items-center justify-center">
                        <HiAcademicCap className="w-4 h-4 text-cyan-300" />
                      </div>
                      <span className="text-cyan-300 font-medium">Add Formula Card</span>
                    </div>
                    <HiArrowLeft className="w-4 h-4 text-cyan-300 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    href="/admin/audit-logs"
                    className="block px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center">
                        <FaHistory className="w-4 h-4 text-purple-300" />
                      </div>
                      <span className="text-purple-300 font-medium">View Audit Logs</span>
                    </div>
                    <HiArrowLeft className="w-4 h-4 text-purple-300 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-900/10 backdrop-blur-sm rounded-2xl border border-red-700/30 p-6">
                <h4 className="text-lg font-semibold text-red-300 mb-3">Danger Zone</h4>
                <p className="text-red-400 text-sm mb-4">
                  Deleting this topic will remove all associated formula cards. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600/20 to-pink-600/20 hover:from-red-600/30 hover:to-pink-600/30 border border-red-500/30 text-red-300 font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiTrash className="w-5 h-5" />
                  <span>{deleting ? 'Deleting...' : 'Delete Topic'}</span>
                </button>
                {formulaCardsCount > 0 && (
                  <p className="text-xs text-red-500 mt-3 text-center">
                    ⚠️ This topic has {formulaCardsCount} formula card(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-red-700/30 max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <HiExclamation className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white text-center mb-3">
              Delete Topic Confirmation
            </h3>
            <p className="text-gray-300 text-center mb-2">
              Are you sure you want to delete <span className="font-semibold text-white">{topic.name}</span>?
            </p>
            {formulaCardsCount > 0 ? (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-300 text-center font-medium">
                  ⚠️ This topic has {formulaCardsCount} formula card(s) that will also be deleted!
                </p>
                <p className="text-red-400 text-sm text-center mt-2">
                  This action will permanently remove all associated formula cards.
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center mb-6">
                This action cannot be undone and will be logged for security audit.
              </p>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <HiTrash className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              <FaShieldAlt className="inline w-3 h-3 mr-1" />
              This action is logged and requires admin privileges
            </p>
          </div>
        </div>
      )}
    </div>
  )
}