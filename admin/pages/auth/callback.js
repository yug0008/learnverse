import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (session?.user) {
        // Verify user has admin role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userData && ['superadmin', 'admin', 'teacher'].includes(userData.role)) {
          router.push('/admin/dashboard')
        } else {
          await supabase.auth.signOut()
          router.push('/not-allowed')
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      router.push('/login?error=callback_failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white">Verifying your credentials...</h2>
        <p className="text-gray-400 mt-2">Security check in progress</p>
      </div>
    </div>
  )
}