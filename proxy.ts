import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/public') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Create response object
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip Supabase session handling for public assets and API routes
  if (!isPublicAsset(pathname) && !pathname.startsWith('/api')) {
    // Create Supabase client with server-side auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options) {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options) {
            request.cookies.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Refresh session
    await supabase.auth.getUser()
  }

  // Check for maintenance mode (skip for admin/staff routes)
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/api') ||
    pathname === '/maintenance' ||
    isPublicAsset(pathname)
  ) {
    return response
  }

  const maintenanceUrl = new URL('/api/maintenance', request.url)
  const res = await fetch(maintenanceUrl, { next: { revalidate: 5 } }).catch(() => null)
  if (!res || !res.ok) return response

  const data = (await res.json().catch(() => null)) as { enabled?: boolean } | null
  if (!data?.enabled) return response

  const url = request.nextUrl.clone()
  url.pathname = '/maintenance'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
