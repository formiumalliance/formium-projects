// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Role → allowed path prefixes
const ROLE_PATHS: Record<string, string[]> = {
  SUPER_ADMIN:              ['/super-admin', '/pm', '/project-head', '/bgm', '/dev'],
  PROJECT_HEAD:             ['/project-head', '/pm', '/bgm'],
  PROJECT_MANAGER:          ['/pm'],
  BUSINESS_GROWTH_MANAGER:  ['/bgm', '/pm'],
  DEVELOPER:                ['/dev'],
  CLIENT_ADMIN:             ['/client'],
  CLIENT_MEMBER:            ['/client'],
}

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN:              '/super-admin',
  PROJECT_HEAD:             '/project-head',
  PROJECT_MANAGER:          '/pm',
  BUSINESS_GROWTH_MANAGER:  '/bgm',
  DEVELOPER:                '/dev',
  CLIENT_ADMIN:             '/client',
  CLIENT_MEMBER:            '/client',
}

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    // @ts-expect-error - nextauth is injected by withAuth
    const token = req.nextauth?.token

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = token.role as string

    // Root redirect
    if (pathname === '/') {
      const home = ROLE_HOME[role] || '/login'
      return NextResponse.redirect(new URL(home, req.url))
    }

    // API routes — pass through (they do their own auth)
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    // Check portal access
    const allowedPaths = ROLE_PATHS[role] || []
    const isDashboardPath =
      pathname.startsWith('/super-admin') ||
      pathname.startsWith('/project-head') ||
      pathname.startsWith('/pm') ||
      pathname.startsWith('/bgm') ||
      pathname.startsWith('/dev') ||
      pathname.startsWith('/client')

    if (isDashboardPath) {
      const hasAccess = allowedPaths.some(p => pathname.startsWith(p))
      if (!hasAccess) {
        // Redirect to their correct home
        const home = ROLE_HOME[role] || '/login'
        return NextResponse.redirect(new URL(home, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    // Exclude Next.js internals, static files, and public assets
    '/((?!_next/static|_next/image|favicon\.ico|apple-touch-icon\.png|branding/).*)',
  ],
}
