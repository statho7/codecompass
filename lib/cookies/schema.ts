/**
 * Cookie Schema and Configuration
 * Defines all cookies used in the application for statistics tracking
 */

export const COOKIE_NAMES = {
  // Analytics & Statistics
  SESSION_ID: 'session_id',          // Anonymous session tracking
  VISIT_COUNT: 'visit_count',        // Number of visits
  LAST_VISIT: 'last_visit',          // Last visit timestamp
  ANALYZED_REPOS: 'analyzed_repos',  // Count of analyzed repos

  // User Preferences
  RECENT_REPOS: 'recent_repos',      // Last 5 searched repos
  FAVORITE_VIEW: 'favorite_view',    // Preferred graph view mode

  // Consent
  COOKIE_CONSENT: 'cookie_consent',  // User consent status
} as const;

export type CookieName = typeof COOKIE_NAMES[keyof typeof COOKIE_NAMES];

export interface CookieConfig {
  maxAge: number;      // Expiration in seconds
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

// Default configuration for analytics cookies
export const DEFAULT_CONFIG: CookieConfig = {
  maxAge: 60 * 60 * 24 * 365, // 1 year
  path: '/',
  httpOnly: false,             // Allow client access for analytics
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

// Specific configurations for different cookie types
export const COOKIE_CONFIGS: Record<CookieName, Partial<CookieConfig>> = {
  [COOKIE_NAMES.SESSION_ID]: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
  },
  [COOKIE_NAMES.VISIT_COUNT]: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
  [COOKIE_NAMES.LAST_VISIT]: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
  [COOKIE_NAMES.ANALYZED_REPOS]: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
  [COOKIE_NAMES.RECENT_REPOS]: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  [COOKIE_NAMES.FAVORITE_VIEW]: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
  [COOKIE_NAMES.COOKIE_CONSENT]: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Must be accessible from client
  },
};

export interface UserStatistics {
  sessionId: string;
  visitCount: number;
  lastVisit: number;
  analyzedRepos: number;
  recentRepos: string[];
  favoriteView?: string;
}
