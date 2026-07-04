import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

const PUBLIC_STAFF_PATHS = ['/login', '/register', '/2fa'];

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/portal')) {
    if (pathname === '/portal/login') return NextResponse.next();

    const portalToken = request.cookies.get('portal_session_token')?.value;
    if (!isValidToken(portalToken)) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_STAFF_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('session_token')?.value;
  if (!isValidToken(sessionToken)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|forms|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
