import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  HiUpload, 
  HiX, 
  HiArrowLeft, 
  HiCheck, 
  HiSave,
  HiSelector,
  HiPhotograph,
  HiTrash
} from 'react-icons/hi'

export default function EditFormulaCard() {
  const router = useRouter()
  const { edit: cardId } = router.query

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [card, setCard] = useState(null)

  // Dropdown data
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')

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
    if (cardId) {
      checkUserAndFetchData()
    }
  }, [cardId])

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject)
    }
  }, [selectedSubject])

  useEffect(() => {
    if (formData.chapter_id) {
      fetchTopics(formData.chapter_id)
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
      await Promise.all([
        fetchSubjects(),
        fetchCard()
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

  async function fetchCard() {
    try {
      const { data, error } = await supabase
        .from('formula_cards')
        .select(`
          *,
          chapters:chapter_id (*, subject:subject_id (*)),
          topics:topic_id (*)
        `)
        .eq('id', cardId)
        .single()

      if (error) throw error

      if (!data) {
        router.push('/admin/formulacards')
        return
      }

      setCard(data)
      setFormData({
        chapter_id: data.chapter_id,
        topic_id: data.topic_id,
        title: data.title || '',
        image_url: data.image_url || '',
        formula_text: data.formula_text || '',
        tags: data.tags || '',
        order: data.order || 0
      })
      setPreviewUrl(data.image_url || '')
      
      // Set selected subject for chapter dropdown
      if (data.chapters?.subject_id) {
        setSelectedSubject(data.chapters.subject_id)
        await fetchChapters(data.chapters.subject_id)
      }
    } catch (error) {
      console.error('Error fetching card:', error)
      router.push('/admin/formulacards')
    } finally {
      setLoading(false)
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

    if (file.size > 250 * 1024) {
      alert('Image size must be less than 250KB')
      return
    }

    // Check aspect ratio
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = async () => {
      const aspectRatio = img.width / img.height
      if (Math.abs(aspectRatio - 0.8) > 0.1) {
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

    setSaving(true)

    try {
      const { error } = await supabase
        .from('formula_cards')
        .update({
          ...formData,
          image_url: formData.image_url || previewUrl
        })
        .eq('id', cardId)

      if (error) throw error

      router.push('/admin/formulacards')
    } catch (error) {
      console.error('Error updating formula card:', error)
      alert('Failed to update formula card')
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

    if (name === 'subject_id' && value) {
      setSelectedSubject(value)
      setFormData(prev => ({ ...prev, chapter_id: '', topic_id: '' }))
    }
    if (name === 'chapter_id') {
      setFormData(prev => ({ ...prev, topic_id: '' }))
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this formula card? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('formula_cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error

      router.push('/admin/formulacards')
    } catch (error) {
      console.error('Error deleting formula card:', error)
      alert('Failed to delete formula card')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading formula card...</p>
        </div>
      </div>
    )
  }

  if (!card) return null

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
                  Edit Formula Card
                </h1>
                <p className="text-gray-400 mt-2">Update formula card details and image</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>ID:</span>
                <span className="font-mono text-cyan-300">{cardId.substring(0, 8)}...</span>
              </div>
              <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
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
                        value={selectedSubject}
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
                        disabled={!selectedSubject}
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
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-700 flex space-x-4">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <HiTrash className="w-5 h-5" />
                    <span>Delete</span>
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Image Upload Section */}
          <div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">Formula Card Image</h3>
              
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

              {/* Current Image Info */}
              {card.image_url && (
                <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Current Image URL:</p>
                  <p className="text-xs text-cyan-300 truncate">{card.image_url}</p>
                </div>
              )}

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
                        <span className="text-gray-300">Change Image</span>
                      </div>
                    )}
                  </div>
                </label>
                <p className="mt-3 text-xs text-gray-500 text-center">
                  Supported: JPG, PNG, WebP • Max 250KB • Aspect: 4:5
                </p>
              </div>

              {/* Card Info */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Card Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-300">
                      {new Date(card.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated</span>
                    <span className="text-gray-300">
                      {new Date(card.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subject</span>
                    <span className="text-emerald-300">
                      {card.chapters?.subject?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chapter</span>
                    <span className="text-purple-300">
                      {card.chapters?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Topic</span>
                    <span className="text-cyan-300">
                      {card.topics?.name || 'N/A'}
                    </span>
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