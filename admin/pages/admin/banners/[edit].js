import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { HiUpload, HiX, HiArrowLeft, HiCheck, HiSave } from 'react-icons/hi'

export default function EditBanner() {
  const router = useRouter()
  const { edit: bannerId } = router.query

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [userRole, setUserRole] = useState(null)
  const [banner, setBanner] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    redirect_url: '',
    is_active: true,
    position: 0
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (bannerId) {
      checkUserAndFetchBanner()
    }
  }, [bannerId])

  async function checkUserAndFetchBanner() {
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
      await fetchBanner()
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  async function fetchBanner() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('id', bannerId)
        .single()

      if (error) throw error

      if (!data) {
        router.push('/admin/banners')
        return
      }

      setBanner(data)
      setFormData({
        title: data.title || '',
        image_url: data.image_url || '',
        redirect_url: data.redirect_url || '',
        is_active: data.is_active,
        position: data.position
      })
      setPreviewUrl(data.image_url || '')
    } catch (error) {
      console.error('Error fetching banner:', error)
      router.push('/admin/banners')
    } finally {
      setLoading(false)
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

    if (!formData.image_url && !previewUrl) {
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

    if (file.size > 200 * 1024) {
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

    setSaving(true)

    try {
      const { error } = await supabase
        .from('banners')
        .update({
          ...formData,
          image_url: formData.image_url || previewUrl
        })
        .eq('id', bannerId)

      if (error) throw error

      router.push('/admin/banners')
    } catch (error) {
      console.error('Error updating banner:', error)
      alert('Failed to update banner')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading banner details...</p>
        </div>
      </div>
    )
  }

  if (!banner) {
    return null
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
                  Edit Banner
                </h1>
                <p className="text-gray-400 mt-2">Update banner details and image</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-300">Role: </span>
                <span className="text-sm font-semibold text-purple-300 capitalize">{userRole}</span>
              </div>
              <div className="text-sm text-gray-400">
                ID: <span className="font-mono text-purple-300">{bannerId.substring(0, 8)}...</span>
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

                {/* Status & Position */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Position
                    </label>
                    <input
                      type="number"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Original Info */}
                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Original Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="text-gray-300">
                        {new Date(banner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="text-gray-300">
                        {new Date(banner.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <HiSave className="w-5 h-5 mr-2" />
                        Update Banner
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
                      <p className="text-sm text-gray-500">Upload a new banner image</p>
                    </div>
                  )}
                </div>
                {errors.image && (
                  <p className="mt-2 text-sm text-red-400">{errors.image}</p>
                )}
              </div>

              {/* Current Image Info */}
              {banner.image_url && (
                <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Current Image URL:</p>
                  <p className="text-xs text-purple-300 truncate">{banner.image_url}</p>
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
                        <span className="text-gray-300">Change Image</span>
                      </div>
                    )}
                  </div>
                </label>
                <p className="mt-3 text-xs text-gray-500 text-center">
                  Supported: JPG, PNG, WebP • Max 200KB
                </p>
              </div>

              {/* Image Stats */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Image Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Original Size</span>
                    <span className="text-gray-300">~150KB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Dimensions</span>
                    <span className="text-gray-300">1200x600px</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Format</span>
                    <span className="text-gray-300">PNG</span>
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