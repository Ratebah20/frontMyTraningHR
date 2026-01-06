import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/refresh'];

// Routes qui nécessitent une authentification
const protectedRoutes = [
  '/dashboard',
  '/collaborateurs',
  '/formations',
  '/sessions',
  '/kpi',
  '/import',
  '/exports',
  '/documents',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Recuperer le token depuis les cookies
  const token = request.cookies.get('accessToken')?.value;

  // Verifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Verifier si c'est une route protegee
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

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

  // Si sur page login avec un token valide -> redirection vers dashboard
  if (pathname === '/login' && token) {
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
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};