import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  HiHome, 
  HiUsers, 
  HiCog, 
  HiShieldCheck, 
  HiClipboardList,
  HiChartBar,
  HiOutlineFolderOpen,
  HiDocumentText,
  HiOutlineCalculator,
  HiLogout
} from 'react-icons/hi'

export default function Sidebar({ user, onLogout }) {
  const router = useRouter()
  
  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HiHome },
    { name: 'Formulacards', href: '/admin/formulacards', icon: HiOutlineCalculator },
    { name: 'Content-Manager', href: '/admin/content-manager', icon: HiOutlineFolderOpen },
    { name: 'Banners', href: '/admin/banners', icon: HiDocumentText },
    { name: 'PYQ/DPP Questions', href: '/admin/questions', icon: HiClipboardList },
    { name: 'Analytics', href: '/admin/analytics', icon: HiChartBar },
    
    { name: 'Security', href: '/admin/security', icon: HiShieldCheck },
    { name: 'Settings', href: '/admin/settings', icon: HiCog },
  ]

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700 z-50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">AD</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-400">v2.1.4 • Secure</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-white">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <div className="flex items-center mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  user?.role === 'superadmin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  user?.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {user?.role}
                </span>
                <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = router.pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-600/20 to-pink-600/20 text-red-300 hover:text-white hover:from-red-600/30 hover:to-pink-600/30 border border-red-500/30 rounded-xl transition-all"
          >
            <HiLogout className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-4">
            Session protected by multi-layer authentication
          </p>
        </div>
      </div>
    </div>
  )
}