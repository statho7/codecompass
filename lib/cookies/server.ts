/**
 * Server-side Cookie Utility Functions
 * Use in Server Components and API routes only
 */

import { cookies } from 'next/headers';
import { COOKIE_NAMES, DEFAULT_CONFIG, COOKIE_CONFIGS, type CookieName, type UserStatistics } from './schema';

export async function setCookie(
  name: CookieName,
  value: string,
  customConfig?: Partial<typeof DEFAULT_CONFIG>
) {
  const cookieStore = await cookies();
  const config = {
    ...DEFAULT_CONFIG,
    ...COOKIE_CONFIGS[name],
    ...customConfig,
  };

  cookieStore.set(name, value, config);
}

export async function getCookie(name: CookieName): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function deleteCookie(name: CookieName) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

export async function hasConsent(): Promise<boolean> {
  const consent = await getCookie(COOKIE_NAMES.COOKIE_CONSENT);
  return consent === 'accepted';
}

/**
 * Initialize or update user session
 * Called automatically by middleware on each request
 */
export async function initializeSession(): Promise<string> {
  const consent = await hasConsent();

  if (!consent) {
    return '';
  }

  let sessionId = await getCookie(COOKIE_NAMES.SESSION_ID);

  if (!sessionId) {
    // First visit - create new session
    sessionId = crypto.randomUUID();
    await setCookie(COOKIE_NAMES.SESSION_ID, sessionId);
    await setCookie(COOKIE_NAMES.VISIT_COUNT, '1');
    await setCookie(COOKIE_NAMES.LAST_VISIT, Date.now().toString());
    await setCookie(COOKIE_NAMES.ANALYZED_REPOS, '0');
    await setCookie(COOKIE_NAMES.RECENT_REPOS, JSON.stringify([]));
  } else {
    // Returning visitor - increment visit count
    const visitCount = parseInt(await getCookie(COOKIE_NAMES.VISIT_COUNT) || '0');
    await setCookie(COOKIE_NAMES.VISIT_COUNT, (visitCount + 1).toString());
    await setCookie(COOKIE_NAMES.LAST_VISIT, Date.now().toString());
  }

  return sessionId;
}

/**
 * Track a repository analysis
 */
export async function trackRepoAnalysis(repoUrl: string) {
  const consent = await hasConsent();
  if (!consent) return;

  // Increment analyzed repos count
  const analyzedCount = parseInt(await getCookie(COOKIE_NAMES.ANALYZED_REPOS) || '0');
  await setCookie(COOKIE_NAMES.ANALYZED_REPOS, (analyzedCount + 1).toString());

  // Update recent repos list (keep last 5)
  const recentReposStr = await getCookie(COOKIE_NAMES.RECENT_REPOS);
  let recentRepos: string[] = [];

  try {
    recentRepos = recentReposStr ? JSON.parse(recentReposStr) : [];
  } catch (e) {
    recentRepos = [];
  }

  // Remove duplicate if exists and add to front
  recentRepos = recentRepos.filter(repo => repo !== repoUrl);
  recentRepos.unshift(repoUrl);
  recentRepos = recentRepos.slice(0, 5);

  await setCookie(COOKIE_NAMES.RECENT_REPOS, JSON.stringify(recentRepos));
}

/**
 * Get user statistics from cookies
 */
export async function getUserStatistics(): Promise<UserStatistics | null> {
  const consent = await hasConsent();
  if (!consent) return null;

  const sessionId = await getCookie(COOKIE_NAMES.SESSION_ID);
  if (!sessionId) return null;

  const visitCount = parseInt(await getCookie(COOKIE_NAMES.VISIT_COUNT) || '0');
  const lastVisit = parseInt(await getCookie(COOKIE_NAMES.LAST_VISIT) || '0');
  const analyzedRepos = parseInt(await getCookie(COOKIE_NAMES.ANALYZED_REPOS) || '0');

  const recentReposStr = await getCookie(COOKIE_NAMES.RECENT_REPOS);
  let recentRepos: string[] = [];
  try {
    recentRepos = recentReposStr ? JSON.parse(recentReposStr) : [];
  } catch (e) {
    recentRepos = [];
  }

  const favoriteView = await getCookie(COOKIE_NAMES.FAVORITE_VIEW);

  return {
    sessionId,
    visitCount,
    lastVisit,
    analyzedRepos,
    recentRepos,
    favoriteView,
  };
}

/**
 * Clear all analytics cookies (for consent withdrawal)
 */
export async function clearAllCookies() {
  await deleteCookie(COOKIE_NAMES.SESSION_ID);
  await deleteCookie(COOKIE_NAMES.VISIT_COUNT);
  await deleteCookie(COOKIE_NAMES.LAST_VISIT);
  await deleteCookie(COOKIE_NAMES.ANALYZED_REPOS);
  await deleteCookie(COOKIE_NAMES.RECENT_REPOS);
  await deleteCookie(COOKIE_NAMES.FAVORITE_VIEW);
  // Keep consent cookie so we remember user declined
}
