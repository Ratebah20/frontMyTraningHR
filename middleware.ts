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
  
  // Pour l'instant, on désactive la vérification du middleware
  // et on laisse le AuthContext gérer la protection des routes
  
  // Redirection pour la page d'accueil uniquement
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
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