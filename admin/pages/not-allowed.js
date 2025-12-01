import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function NotAllowed() {
  const router = useRouter()

  useEffect(() => {
    // Auto logout after 5 seconds
    const timer = setTimeout(() => {
      supabase.auth.signOut()
      router.push('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-500/30">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6a3 3 0 11-6 0 3 3 0 016 0zM7.5 20.5L3 21l.5-4.5m17 4.5l-4.5-.5.5-4.5" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300">Authorization Level Insufficient</p>
        </div>

        <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30 mb-8">
          <h2 className="text-xl font-semibold text-red-300 mb-4">Security Alert</h2>
          <p className="text-gray-300 mb-6">
            Your account does not have the required administrative privileges to access this portal.
            This incident has been logged and reported to the security team.
          </p>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
              <span className="text-gray-400">Access attempt logged</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3" />
              <span className="text-gray-400">IP address recorded</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3" />
              <span className="text-gray-400">Session terminated</span>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-sm">
          You will be redirected to the login page in 5 seconds.
          <br />
          For access requests, contact your system administrator.
        </p>
      </div>
    </div>
  )
}