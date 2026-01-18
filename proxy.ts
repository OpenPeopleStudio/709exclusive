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

function isTestSubdomain(host: string): boolean {
  const normalizedHost = host.replace(/:\d+$/, '').toLowerCase()
  return (
    normalizedHost === 'test.localhost' ||
    normalizedHost.startsWith('test.709exclusive') ||
    normalizedHost === 'test.709exclusive.shop'
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''
  
  // Handle test subdomain routing
  if (isTestSubdomain(host)) {
    // API routes - let pass
    if (pathname.startsWith('/api')) {
      // Continue to normal processing
    }
    // Already on test routes - let it pass
    else if (pathname.startsWith('/test')) {
      // Continue to normal processing
    }
    // These routes work with the main site's layout (cart, account, product, checkout)
    else if (pathname.startsWith('/product') || pathname.startsWith('/cart') || pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
      // Continue to normal processing
    }
    // Redirect root to /test
    else if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/test'
      return NextResponse.rewrite(url)
    }
    // For /shop, redirect to /test
    else if (pathname === '/shop') {
      const url = request.nextUrl.clone()
      url.pathname = '/test'
      return NextResponse.rewrite(url)
    }
  }
  
  // Block test routes from main domain (only in production)
  // Allow /test in development for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (!isDevelopment && !isTestSubdomain(host) && pathname.startsWith('/test')) {
    const url = request.nextUrl.clone()
    url.pathname = '/not-found'
    return NextResponse.rewrite(url)
  }
  
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
