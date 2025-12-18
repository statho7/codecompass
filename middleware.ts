/**
 * Middleware for Cookie Management and Session Tracking
 * Automatically tracks user sessions and visits when consent is given
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAMES } from '@/lib/cookies/schema';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check if user has consented to cookies
  const consent = request.cookies.get(COOKIE_NAMES.COOKIE_CONSENT)?.value;

  if (consent !== 'accepted') {
    // No consent - don't track anything
    return response;
  }

  // Check if session exists
  const sessionId = request.cookies.get(COOKIE_NAMES.SESSION_ID)?.value;

  if (!sessionId) {
    // First visit with consent - create new session
    const newSessionId = crypto.randomUUID();

    response.cookies.set(COOKIE_NAMES.SESSION_ID, newSessionId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set(COOKIE_NAMES.VISIT_COUNT, '1', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set(COOKIE_NAMES.LAST_VISIT, Date.now().toString(), {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set(COOKIE_NAMES.ANALYZED_REPOS, '0', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set(COOKIE_NAMES.RECENT_REPOS, JSON.stringify([]), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  } else {
    // Returning visitor - update visit tracking
    const visitCount = parseInt(request.cookies.get(COOKIE_NAMES.VISIT_COUNT)?.value || '0');

    response.cookies.set(COOKIE_NAMES.VISIT_COUNT, (visitCount + 1).toString(), {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set(COOKIE_NAMES.LAST_VISIT, Date.now().toString(), {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
