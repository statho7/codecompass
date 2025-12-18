/**
 * Client-side Cookie Utility Functions
 * Use in Client Components only
 */

import { COOKIE_NAMES, DEFAULT_CONFIG, COOKIE_CONFIGS, type CookieName, type UserStatistics } from './schema';

/**
 * Get cookie value from document.cookie (client-side only)
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);

  return cookies[name];
}

/**
 * Set cookie from client (client-side only)
 */
export function setCookie(name: string, value: string, maxAge = 31536000) {
  if (typeof document === 'undefined') return;

  const config = COOKIE_CONFIGS[name as CookieName] || DEFAULT_CONFIG;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${config.path}; max-age=${maxAge}; samesite=${config.sameSite}${config.secure ? '; secure' : ''}`;
}

/**
 * Get user statistics from client
 */
export function getUserStats(): UserStatistics | null {
  const consent = getCookie(COOKIE_NAMES.COOKIE_CONSENT);
  if (consent !== 'accepted') return null;

  const sessionId = getCookie(COOKIE_NAMES.SESSION_ID);
  if (!sessionId) return null;

  const visitCount = parseInt(getCookie(COOKIE_NAMES.VISIT_COUNT) || '0');
  const lastVisit = parseInt(getCookie(COOKIE_NAMES.LAST_VISIT) || '0');
  const analyzedRepos = parseInt(getCookie(COOKIE_NAMES.ANALYZED_REPOS) || '0');

  let recentRepos: string[] = [];
  try {
    const recentReposStr = getCookie(COOKIE_NAMES.RECENT_REPOS);
    recentRepos = recentReposStr ? JSON.parse(recentReposStr) : [];
  } catch (e) {
    recentRepos = [];
  }

  const favoriteView = getCookie(COOKIE_NAMES.FAVORITE_VIEW);

  return {
    sessionId,
    visitCount,
    lastVisit,
    analyzedRepos,
    recentRepos,
    favoriteView,
  };
}
