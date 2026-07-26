import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/', '/login', '/register', '/forgot-password'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Next.js Server Actions veya Prefetch isteklerinde (Next-Action, Next-Router-Prefetch vb.)
  // proxy üzerinden fetch yapmayı atlayalım, aksiyonun kendi içinde session kontrolü zaten var.
  const isServerAction = request.headers.has('Next-Action');
  const isPrefetch = request.headers.has('Next-Router-Prefetch');
  
  if ((!isProtectedRoute && !isPublicRoute) || isServerAction || isPrefetch) {
    return NextResponse.next();
  }

  // Better-Auth get-session API call
  let session = null;
  try {
    const internalPort = process.env.PORT || 3000;
    const baseUrl = process.env.NODE_ENV === 'production' ? `http://127.0.0.1:${internalPort}` : request.nextUrl.origin;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 saniye timeout (deadlock önlemek için)

    const response = await fetch(`${baseUrl}/api/auth/get-session`, {
      signal: controller.signal,
      headers: {
        cookie: request.headers.get("cookie") || "",
        "x-forwarded-host": request.headers.get("host") || "",
        host: request.headers.get("host") || "",
      },
    });
    
    clearTimeout(timeoutId);
    if (response.ok) {
      session = await response.json();
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error("Middleware session fetch error:", error.message);
    }
  }

  if (isProtectedRoute && !session?.user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isPublicRoute && session?.user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|favicon).*)'],
};
