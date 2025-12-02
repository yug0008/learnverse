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
  HiOutlineBookOpen,
  HiOutlineFolder
} from 'react-icons/hi'
import { FaBook } from 'react-icons/fa'

export default function CreateChapter() {
  const router = useRouter()
  const { subject: subjectId } = router.query

  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(subjectId || '')

  const [formData, setFormData] = useState({
    subject_id: subjectId || '',
    name: '',
    slug: '',
    order: 0
  })

  const [errors, setErrors] = useState({})
  const [slugAvailable, setSlugAvailable] = useState(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (subjectId) {
      setSelectedSubject(subjectId)
      setFormData(prev => ({ ...prev, subject_id: subjectId }))
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
      await fetchSubjects()
      
      // Get next order number
      const { data: maxOrderData } = await supabase
        .from('chapters')
        .select('order')
        .order('order', { ascending: false })
        .limit(1)
        .single()

      setFormData(prev => ({
        ...prev,
        order: maxOrderData ? maxOrderData.order + 1 : 0
      }))
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
        .from('chapters')
        .select('slug')
        .eq('slug', formData.slug)
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
    } else if (!slugAvailable) {
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

    setLoading(true)

    try {
      const { error } = await supabase
        .from('chapters')
        .insert([{
          ...formData,
          id: crypto.randomUUID()
        }])

      if (error) throw error

      alert('Chapter created successfully!')
      router.push(`/admin/chapters${formData.subject_id ? `?subject=${formData.subject_id}` : ''}`)
    } catch (error) {
      console.error('Error creating chapter:', error)
      alert('Failed to create chapter')
    } finally {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/admin/chapters${subjectId ? `?subject=${subjectId}` : ''}`}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Create New Chapter
                </h1>
                <p className="text-gray-400 mt-2">Add a new chapter to organize topics and formula cards</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-300">Role: </span>
              <span className="text-sm font-semibold text-pink-300 capitalize">{userRole}</span>
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
                  <div className="mt-2">
                    <Link
                      href="/admin/subject/new"
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1"
                    >
                      <HiPlus className="w-3 h-3" />
                      <span>Add new subject</span>
                    </Link>
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      URL Slug *
                    </label>
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
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
                      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                      placeholder="algebra"
                      maxLength={50}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingSlug ? (
                        <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                      ) : slugAvailable === true ? (
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
                  <p className="mt-2 text-sm text-gray-400">
                    Used in URLs. Lowercase letters, numbers, and hyphens only.
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
                      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    />
                  </div>
                  {errors.order && (
                    <p className="mt-2 text-sm text-red-400">{errors.order}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-400">
                    Lower numbers appear first. Leave as auto-generated for new items.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={loading || checkingSlug}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Creating Chapter...
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-5 h-5 mr-2" />
                        Create Chapter
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
              {/* Info Card */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FaBook className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  Chapter Information
                </h3>
                <p className="text-gray-400 text-sm text-center">
                  Chapters organize topics within subjects for better content management
                </p>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Benefits</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Organize topics within subjects</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Create logical learning paths</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Enable better content discoverability</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>Facilitate progressive learning</span>
                  </li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="mb-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link
                    href="/admin/subjects"
                    className="block px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-300">Manage Subjects</span>
                      <HiArrowLeft className="w-4 h-4 text-emerald-300 rotate-180" />
                    </div>
                  </Link>
                  <Link
                    href="/admin/topics/new"
                    className="block px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-blue-300">Add Topic</span>
                      <HiPlus className="w-4 h-4 text-blue-300" />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Tips */}
              <div className="pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Tips</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Use clear, descriptive chapter names</li>
                  <li>• Follow a logical learning sequence</li>
                  <li>• Keep slugs short and memorable</li>
                  <li>• Plan your chapter order carefully</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}