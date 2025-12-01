import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()

  try {
    // Create Supabase client for middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Protect ALL /admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // 1. Get the user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Auth error:', authError)
        return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
      }

      // 2. Fetch user role from database (not from session!)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        console.error('Role fetch error:', userError)
        return NextResponse.redirect(new URL('/login?error=no_role', req.url))
      }

      // 3. Check if user has admin access
      const allowedRoles = ['superadmin', 'admin', 'teacher']
      if (!allowedRoles.includes(userData.role)) {
        // Log unauthorized access attempt
        console.warn(`Unauthorized access attempt by user: ${user.id} with role: ${userData.role}`)
        return NextResponse.redirect(new URL('/not-allowed', req.url))
      }

      // 4. Add user role to headers for additional security
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-role', userData.role)
      requestHeaders.set('x-user-id', user.id)
      requestHeaders.set('x-user-email', user.email)

      // 5. Return response with headers
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })

      // Set response headers as well
      response.headers.set('x-user-role', userData.role)
      response.headers.set('x-user-id', user.id)

      return response
    }

    // 6. For API routes under /api/admin
    if (req.nextUrl.pathname.startsWith('/api/admin')) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 403 }
        )
      }

      const allowedRoles = ['superadmin', 'admin', 'teacher']
      if (!allowedRoles.includes(userData.role)) {
        return NextResponse.json(
          { error: 'Insufficient privileges' },
          { status: 403 }
        )
      }

      // Add user info to request headers for API route handlers
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-role', userData.role)
      requestHeaders.set('x-user-id', user.id)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

  } catch (error) {
    console.error('Middleware error:', error)
    // In case of ANY error, deny access
    return NextResponse.redirect(new URL('/login?error=system_error', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}