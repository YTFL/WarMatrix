import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect console routes
  if (pathname.startsWith('/console')) {
    const authCookie = request.cookies.get('warmatrix_token');
    
    // Simulate Firewall Check
    const firewallActive = true; 
    
    if (firewallActive && !authCookie) {
      console.log(`[FIREWALL] Unauthorized access attempt to ${pathname} - BLOCKED`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/console/:path*', '/api/sitrep/:path*'],
};
