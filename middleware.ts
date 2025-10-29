import { NextResponse, type NextRequest } from 'next/server'
import { verifyJWT } from './lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // Allow login and API routes
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Protect API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      const payload = await verifyJWT(token)
      
      // Check admin access for users API
      if (request.nextUrl.pathname.startsWith('/api/users') && payload.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
      
      return NextResponse.next()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
  }

  // Protect app routes
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    const payload = await verifyJWT(token)
    
    // Check admin access for users page
    if (request.nextUrl.pathname.startsWith('/users') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    return NextResponse.next()
  } catch (error) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    '/terms/:path*',
    '/phrases/:path*',
    '/categories/:path*',
    '/users/:path*',
    '/api/:path*'
  ]
}