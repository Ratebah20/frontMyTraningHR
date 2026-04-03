import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/', '/login', '/invitation', '/api/auth/login', '/api/auth/refresh'];

// Routes RH (dashboard) qui nécessitent le rôle RH
const rhRoutes = [
  '/dashboard',
  '/collaborateurs',
  '/formations',
  '/sessions',
  '/kpi',
  '/import',
  '/exports',
  '/documents',
  '/settings',
  '/organismes',
  '/managers',
  '/budget',
  '/templates',
  '/ai-assistant',
  '/comptes-managers',
];

// Routes manager qui nécessitent le rôle MANAGER
const managerRoutes = [
  '/manager',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Recuperer le token et le rôle depuis les cookies
  const token = request.cookies.get('accessToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  // Verifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Verifier si c'est une route RH
  const isRhRoute = rhRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Verifier si c'est une route manager
  const isManagerRoute = managerRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  const isProtectedRoute = isRhRoute || isManagerRoute;

  // Redirection page d'accueil vers login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si route protegee et pas de token -> redirection vers login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  if (token && userRole) {
    // MANAGER trying to access RH routes -> redirect to manager dashboard
    if (isRhRoute && userRole === 'MANAGER') {
      return NextResponse.redirect(new URL('/manager/dashboard', request.url));
    }

    // RH trying to access manager routes -> redirect to RH dashboard
    if (isManagerRoute && userRole === 'RH') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Si sur page login avec un token valide -> redirection vers le bon dashboard
  if (pathname === '/login' && token) {
    if (userRole === 'MANAGER') {
      return NextResponse.redirect(new URL('/manager/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|img).*)',
  ],
};