import { NextResponse, type NextRequest } from 'next/server'

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

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/api') ||
    pathname === '/maintenance' ||
    isPublicAsset(pathname)
  ) {
    return NextResponse.next()
  }

  const maintenanceUrl = new URL('/api/maintenance', request.url)
  const res = await fetch(maintenanceUrl, { next: { revalidate: 5 } }).catch(() => null)
  if (!res || !res.ok) return NextResponse.next()

  const data = (await res.json().catch(() => null)) as { enabled?: boolean } | null
  if (!data?.enabled) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/maintenance'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
