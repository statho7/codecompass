'use client';

/**
 * Cookie Consent Banner
 * GDPR/CCPA compliant cookie consent UI
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { COOKIE_NAMES } from '@/lib/cookies/schema';
import { getCookie, setCookie } from '@/lib/cookies/client';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has already made a consent decision
    const consent = getCookie(COOKIE_NAMES.COOKIE_CONSENT);

    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = async () => {
    setIsLoading(true);

    // Set consent cookie
    setCookie(COOKIE_NAMES.COOKIE_CONSENT, 'accepted');

    // Reload page to initialize tracking
    window.location.reload();
  };

  const handleDecline = () => {
    setIsLoading(true);

    // Set declined consent cookie
    setCookie(COOKIE_NAMES.COOKIE_CONSENT, 'declined');

    setShowBanner(false);
    setIsLoading(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1">🍪 Cookie Consent</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your experience and track basic usage statistics.
              This includes visit counts, analyzed repositories, and recent searches.
              <span className="font-medium"> No personal data is collected or shared.</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              You can change your preference at any time.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              disabled={isLoading}
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isLoading}
            >
              {isLoading ? 'Accepting...' : 'Accept Cookies'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
