import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { HiUpload, HiX, HiArrowLeft, HiCheck } from 'react-icons/hi'

export default function CreateBanner() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [userRole, setUserRole] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    redirect_url: '',
    is_active: true,
    position: 0
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
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
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.redirect_url && !/^https?:\/\/.+\..+/.test(formData.redirect_url)) {
      newErrors.redirect_url = 'Please enter a valid URL'
    }

    if (!previewUrl) {
      newErrors.image = 'Banner image is required'
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

    if (file.size > 200 * 1024) { // 200KB
      alert('Image size must be less than 200KB')
      return
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
      const filePath = `banners/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Get next position
      const { data: banners } = await supabase
        .from('banners')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = banners && banners.length > 0 ? banners[0].position + 1 : 0

      const { error } = await supabase
        .from('banners')
        .insert([{
          ...formData,
          image_url: formData.image_url || previewUrl,
          position: nextPosition
        }])

      if (error) throw error

      router.push('/admin/banners')
    } catch (error) {
      console.error('Error creating banner:', error)
      alert('Failed to create banner')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/banners"
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Create New Banner
                </h1>
                <p className="text-gray-400 mt-2">Add a new promotional banner to your website</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-300">Role: </span>
              <span className="text-sm font-semibold text-purple-300 capitalize">{userRole}</span>
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
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-900/50 border ${
                      errors.title ? 'border-red-500/50' : 'border-gray-600'
                    } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="Enter banner title"
                    maxLength={100}
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-400">{errors.title}</p>
                  )}
                </div>

                {/* Redirect URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Redirect URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="redirect_url"
                    value={formData.redirect_url}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-900/50 border ${
                      errors.redirect_url ? 'border-red-500/50' : 'border-gray-600'
                    } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                    placeholder="https://example.com"
                  />
                  {errors.redirect_url && (
                    <p className="mt-2 text-sm text-red-400">{errors.redirect_url}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-sm font-medium text-gray-300">Active Banner</span>
                  </label>
                  <p className="mt-2 text-sm text-gray-400">
                    Inactive banners won't be displayed on the website
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Creating Banner...
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-5 h-5 mr-2" />
                        Create Banner
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
              <h3 className="text-lg font-semibold text-white mb-4">Banner Image</h3>
              
              {/* Preview */}
              <div className="mb-6">
                <div className={`w-full aspect-video rounded-xl border-2 ${
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
                        <HiUpload className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400 mb-2">No image selected</p>
                      <p className="text-sm text-gray-500">Upload a banner image</p>
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
                    uploading ? 'border-purple-500/50' : 'border-gray-600 hover:border-purple-500'
                  } rounded-xl text-center cursor-pointer transition-colors ${uploading ? 'cursor-not-allowed' : ''}`}>
                    {uploading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                        <span className="text-purple-300">Uploading...</span>
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
                  Supported: JPG, PNG, WebP • Max 200KB
                </p>
              </div>

              {/* Requirements */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Requirements</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>High-quality promotional image</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Landscape orientation recommended</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Clear text and visuals</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>Brand-consistent colors</span>
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