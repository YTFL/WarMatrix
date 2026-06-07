import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_API_KEY_COOKIE } from './src/lib/gemini-auth';

function needsBypass(pathname: string) {
  return pathname === '/login' || pathname.startsWith('/api');
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = request.nextUrl.hostname;
  const isVercel = host.split(':')[0].endsWith('.vercel.app') || hostname.endsWith('.vercel.app');
  const isKeyRequired = process.env.USE_GEMINI_KEY === 'true' || isVercel;

  if (!isKeyRequired) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (needsBypass(pathname)) {
    return NextResponse.next();
  }

  const geminiApiKey = request.cookies.get(GEMINI_API_KEY_COOKIE)?.value?.trim();
  if (geminiApiKey) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.search = '';
  redirectUrl.searchParams.set('next', `${pathname}${search}`);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
