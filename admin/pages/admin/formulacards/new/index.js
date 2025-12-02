import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  HiUpload, 
  HiX, 
  HiArrowLeft, 
  HiCheck, 
  HiPlus,
  HiSelector,
  HiPhotograph
} from 'react-icons/hi'

export default function CreateFormulaCard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [userRole, setUserRole] = useState(null)

  // Dropdown data
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])

  const [formData, setFormData] = useState({
    chapter_id: '',
    topic_id: '',
    title: '',
    image_url: '',
    formula_text: '',
    tags: '',
    order: 0
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (formData.chapter_id) {
      fetchTopics(formData.chapter_id)
    } else {
      setTopics([])
    }
  }, [formData.chapter_id])

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
        .from('formula_cards')
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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.chapter_id) {
      newErrors.chapter_id = 'Chapter is required'
    }
    if (!formData.topic_id) {
      newErrors.topic_id = 'Topic is required'
    }
    if (!formData.image_url && !previewUrl) {
      newErrors.image = 'Formula card image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Only JPG, PNG, and WebP images are allowed')
      return
    }

    if (file.size > 250 * 1024) { // 250KB
      alert('Image size must be less than 250KB')
      return
    }

    // Check aspect ratio (4:5 = 0.8)
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = async () => {
      const aspectRatio = img.width / img.height
      if (Math.abs(aspectRatio - 0.8) > 0.1) { // Allow 10% tolerance
        if (!confirm(`Recommended aspect ratio is 4:5 (0.8). Your image is ${img.width}x${img.height} (${aspectRatio.toFixed(2)}). Continue anyway?`)) {
          return
        }
      }

      setUploading(true)

      try {
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result)
        }
        reader.readAsDataURL(file)

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `formulacards/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('formulacards')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('formulacards')
          .getPublicUrl(filePath)

        setFormData(prev => ({ ...prev, image_url: publicUrl }))
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload image')
      } finally {
        setUploading(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('formula_cards')
        .insert([{
          ...formData,
          id: crypto.randomUUID(),
          image_url: formData.image_url || previewUrl
        }])

      if (error) throw error

      router.push('/admin/formulacards')
    } catch (error) {
      console.error('Error creating formula card:', error)
      alert('Failed to create formula card')
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

    // When subject changes, fetch its chapters
    if (name === 'subject_id' && value) {
      fetchChapters(value)
      setFormData(prev => ({ ...prev, chapter_id: '', topic_id: '' }))
    }
    // When chapter changes, clear topic
    if (name === 'chapter_id') {
      setFormData(prev => ({ ...prev, topic_id: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/formulacards"
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Create Formula Card
                </h1>
                <p className="text-gray-400 mt-2">Add a new formula card with image and details</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-300">Role: </span>
                <span className="text-sm font-semibold text-cyan-300 capitalize">{userRole}</span>
              </div>
              <Link
                href="/admin/subjects/new"
                className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors flex items-center space-x-2 text-sm"
              >
                <HiPlus className="w-4 h-4" />
                <span>New Subject</span>
              </Link>
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
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Card Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-900/50 border ${
                      errors.title ? 'border-red-500/50' : 'border-gray-600'
                    } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Enter formula card title"
                    maxLength={200}
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-400">{errors.title}</p>
                  )}
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subject *
                    </label>
                    <div className="relative">
                      <select
                        name="subject_id"
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
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
                    <div className="mt-2">
                      <Link
                        href="/admin/subject/new"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                      >
                        <HiPlus className="w-3 h-3" />
                        <span>Add new subject</span>
                      </Link>
                    </div>
                  </div>

                  {/* Chapter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Chapter *
                    </label>
                    <div className="relative">
                      <select
                        name="chapter_id"
                        value={formData.chapter_id}
                        onChange={handleInputChange}
                        disabled={!formData.subject_id}
                        className={`w-full px-4 py-3 bg-gray-900/50 border ${
                          errors.chapter_id ? 'border-red-500/50' : 'border-gray-600'
                        } rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="">Select Chapter</option>
                        {chapters.map(chapter => (
                          <option key={chapter.id} value={chapter.id}>
                            {chapter.name}
                          </option>
                        ))}
                      </select>
                      <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.chapter_id && (
                      <p className="mt-2 text-sm text-red-400">{errors.chapter_id}</p>
                    )}
                    <div className="mt-2">
                      <Link
                        href="/admin/chapters/new"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                      >
                        <HiPlus className="w-3 h-3" />
                        <span>Add new chapter</span>
                      </Link>
                    </div>
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Topic *
                    </label>
                    <div className="relative">
                      <select
                        name="topic_id"
                        value={formData.topic_id}
                        onChange={handleInputChange}
                        disabled={!formData.chapter_id}
                        className={`w-full px-4 py-3 bg-gray-900/50 border ${
                          errors.topic_id ? 'border-red-500/50' : 'border-gray-600'
                        } rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="">Select Topic</option>
                        {topics.map(topic => (
                          <option key={topic.id} value={topic.id}>
                            {topic.name}
                          </option>
                        ))}
                      </select>
                      <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.topic_id && (
                      <p className="mt-2 text-sm text-red-400">{errors.topic_id}</p>
                    )}
                    <div className="mt-2">
                      <Link
                        href="/admin/topics/new"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                      >
                        <HiPlus className="w-3 h-3" />
                        <span>Add new topic</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Formula Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Formula Text
                  </label>
                  <textarea
                    name="formula_text"
                    value={formData.formula_text}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                    placeholder="Enter formula in LaTeX or plain text"
                    maxLength={500}
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    Use LaTeX syntax for mathematical formulas: $E = mc^2$
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="physics, mechanics, force, energy"
                    maxLength={200}
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    Separate tags with commas. Example: algebra, quadratic, equation
                  </p>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    Lower numbers appear first. Leave as auto-generated for new items.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Creating Formula Card...
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-5 h-5 mr-2" />
                        Create Formula Card
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">Formula Card Image</h3>
              <p className="text-sm text-gray-400 mb-6">
                Upload an image of the formula card. Recommended aspect ratio is 4:5 (portrait).
              </p>
              
              {/* Preview */}
              <div className="mb-6">
                <div className={`aspect-[4/5] rounded-xl border-2 ${
                  previewUrl ? 'border-gray-600' : 'border-dashed border-gray-600'
                } overflow-hidden bg-gray-900/50 flex items-center justify-center`}>
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setPreviewUrl('')
                          setFormData(prev => ({ ...prev, image_url: '' }))
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiPhotograph className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400 mb-2">No image selected</p>
                      <p className="text-sm text-gray-500">Upload formula card image</p>
                    </div>
                  )}
                </div>
                {errors.image && (
                  <p className="mt-2 text-sm text-red-400">{errors.image}</p>
                )}
              </div>

              {/* Upload Button */}
              <div>
                <label className="block">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className={`w-full py-3.5 px-4 border-2 border-dashed ${
                    uploading ? 'border-blue-500/50' : 'border-gray-600 hover:border-blue-500'
                  } rounded-xl text-center cursor-pointer transition-colors ${uploading ? 'cursor-not-allowed' : ''}`}>
                    {uploading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
                        <span className="text-blue-300">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <HiUpload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-300">Upload Image</span>
                      </div>
                    )}
                  </div>
                </label>
                <p className="mt-3 text-xs text-gray-500 text-center">
                  Supported: JPG, PNG, WebP • Max 250KB • Aspect: 4:5
                </p>
              </div>

              {/* Requirements */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Image Requirements</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>High-quality formula image</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Portrait orientation (4:5 ratio)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Clear, readable text</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Good contrast and lighting</span>
                  </li>
                </ul>
              </div>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Management</h4>
                <div className="space-y-2">
                  <Link
                    href="/admin/subject"
                    className="block px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-300">Manage Subjects</span>
                      <HiArrowLeft className="w-4 h-4 text-emerald-300 rotate-180" />
                    </div>
                  </Link>
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
                    href="/admin/topics"
                    className="block px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-blue-300">Manage Topics</span>
                      <HiArrowLeft className="w-4 h-4 text-blue-300 rotate-180" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}