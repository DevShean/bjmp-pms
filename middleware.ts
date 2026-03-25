import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes and their required roles
  const protectedRoutes = [
    { path: '/admin-page', role: 'Administrator' },
    { path: '/officer-page', role: 'Correctional Officer' },
    { path: '/medical-page', role: 'Medical Staff' },
    { path: '/rehab-page', role: 'Rehabilitation Staff' },
    { path: '/visitor-page', role: 'Visitor' },
  ];

  // Find if current path is protected
  const route = protectedRoutes.find(r => pathname.startsWith(r.path));

  if (route) {
    const sessionCookie = request.cookies.get('bjmp_session');

    if (!sessionCookie) {
      // No session, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }

    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie.value));
      
      // Verify role access
      if (session.role !== route.role) {
        // Role mismatch, redirect to login
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    } catch {
      // Invalid session cookie
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();

  // Add cache-control headers to all protected routes to prevent BFCache (back button issues)
  if (route) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin-page/:path*',
    '/officer-page/:path*',
    '/medical-page/:path*',
    '/rehab-page/:path*',
    '/visitor-page/:path*',
  ],
};
