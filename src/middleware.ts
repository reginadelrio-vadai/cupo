import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
]

const PUBLIC_PREFIXES = [
  '/book/',
  '/api/agent/',
  '/api/booking/',
  '/api/webhooks/',
  '/api/cron/',
  '/api/google/',
]

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let public routes through (still refresh session if cookie exists)
  if (isPublicRoute(pathname)) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // Protected routes — require auth
  const { user, supabaseResponse } = await updateSession(request)

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // User authenticated but no organization → onboarding
  const orgId = user.app_metadata?.organization_id
  if (!orgId && pathname !== '/onboarding' && !pathname.startsWith('/api/onboarding')) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // User has org but trying to access onboarding → dashboard
  if (orgId && pathname === '/onboarding') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
