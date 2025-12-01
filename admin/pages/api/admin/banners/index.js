import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check user role from middleware headers
    const userRole = req.headers['x-user-role']
    const userId = req.headers['x-user-id']

    if (!userRole || !userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Verify user has admin privileges
    const allowedRoles = ['superadmin', 'admin', 'teacher']
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient privileges' })
    }

    const supabase = createRouteHandlerClient({ req, res })

    if (req.method === 'GET') {
      // Get all banners with pagination
      const { page = 1, limit = 10 } = req.query
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data: banners, error, count } = await supabase
        .from('banners')
        .select('*', { count: 'exact' })
        .order('position', { ascending: true })
        .range(from, to)

      if (error) throw error

      return res.status(200).json({
        banners,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      })
    }

    if (req.method === 'POST') {
      const { title, image_url, redirect_url, is_active = true } = req.body

      if (!title || !image_url) {
        return res.status(400).json({ error: 'Title and image URL are required' })
      }

      // Get max position
      const { data: maxPosData } = await supabase
        .from('banners')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .single()

      const position = maxPosData ? maxPosData.position + 1 : 0

      const { data: banner, error } = await supabase
        .from('banners')
        .insert([{
          title,
          image_url,
          redirect_url,
          is_active,
          position
        }])
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({ banner })
    }

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}