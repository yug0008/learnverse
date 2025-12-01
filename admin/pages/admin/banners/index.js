import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import {
  HiPlus, HiPencil, HiTrash, HiEye, HiEyeOff,
  HiArrowUp, HiArrowDown, HiExternalLink, HiRefresh
} from 'react-icons/hi'

export default function BannersList() {
  const router = useRouter()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'position', direction: 'asc' })

  useEffect(() => {
    checkUserAndFetchBanners()
  }, [])

  async function checkUserAndFetchBanners() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get user role
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
      await fetchBanners()
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  async function fetchBanners() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('position', { ascending: true })

      if (error) throw error
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleBannerStatus(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      
      setBanners(banners.map(banner => 
        banner.id === id ? { ...banner, is_active: !currentStatus } : banner
      ))
    } catch (error) {
      console.error('Error updating banner:', error)
      alert('Failed to update banner status')
    }
  }

  async function deleteBanner(id) {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setBanners(banners.filter(banner => banner.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('Failed to delete banner')
    }
  }

  async function updatePosition(id, newPosition) {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ position: newPosition })
        .eq('id', id)

      if (error) throw error
      
      // Re-fetch to get updated order
      await fetchBanners()
    } catch (error) {
      console.error('Error updating position:', error)
    }
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedBanners = [...banners].sort((a, b) => {
    if (sortConfig.key === 'created_at') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at)
    }
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading banners...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Banner Management
              </h1>
              <p className="text-gray-400 mt-2">Manage website banners and promotions</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchBanners}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2"
              >
                <HiRefresh className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <Link
                href="/admin/banners/new"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <HiPlus className="w-5 h-5" />
                <span>Add New Banner</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Banners</p>
                <p className="text-3xl font-bold mt-2 text-white">{banners.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <HiEye className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Banners</p>
                <p className="text-3xl font-bold mt-2 text-green-400">
                  {banners.filter(b => b.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Inactive Banners</p>
                <p className="text-3xl font-bold mt-2 text-yellow-400">
                  {banners.filter(b => !b.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <HiEyeOff className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Your Role</p>
                <p className="text-2xl font-bold mt-2 capitalize text-purple-300">{userRole}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <div className="text-xs font-bold text-blue-300">AD</div>
              </div>
            </div>
          </div>
        </div>

        {/* Banners Table */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">All Banners</h2>
            <div className="text-sm text-gray-400">
              Showing {sortedBanners.length} banner{sortedBanners.length !== 1 ? 's' : ''}
            </div>
          </div>

          {sortedBanners.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiEye className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No banners found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first banner</p>
              <Link
                href="/admin/banners/new"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
              >
                <HiPlus className="w-5 h-5" />
                <span>Create Banner</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('position')}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <span>Position</span>
                        {sortConfig.key === 'position' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left text-gray-400">Banner</th>
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <span>Title</span>
                        {sortConfig.key === 'title' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left text-gray-400">Status</th>
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <span>Created</span>
                        {sortConfig.key === 'created_at' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {sortedBanners.map((banner, index) => (
                    <tr key={banner.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updatePosition(banner.id, banner.position - 1)}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                          >
                            <HiArrowUp className="w-5 h-5" />
                          </button>
                          <span className="font-mono text-lg font-bold text-purple-300">
                            {banner.position}
                          </span>
                          <button
                            onClick={() => updatePosition(banner.id, banner.position + 1)}
                            disabled={index === banners.length - 1}
                            className={`p-1 rounded ${index === banners.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                          >
                            <HiArrowDown className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-32 h-16 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 relative group">
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a
                              href={banner.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white/20 backdrop-blur-sm rounded hover:bg-white/30 transition-colors"
                            >
                              <HiExternalLink className="w-4 h-4 text-white" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-white">{banner.title}</p>
                          {banner.redirect_url && (
                            <a
                              href={banner.redirect_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-400 hover:text-purple-300 transition-colors truncate max-w-xs block"
                            >
                              {banner.redirect_url}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            banner.is_active
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                          }`}
                        >
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-400">
                          {new Date(banner.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/banners/${banner.id}`}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit"
                          >
                            <HiPencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(banner.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this banner? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBanner(deleteConfirm)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
              >
                Delete Banner
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}