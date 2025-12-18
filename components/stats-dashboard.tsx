'use client';

/**
 * Statistics Dashboard
 * Displays user statistics from cookies
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getUserStats } from '@/lib/cookies/client';
import type { UserStatistics } from '@/lib/cookies/schema';

export function StatsDashboard() {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read statistics from cookies
    const userStats = getUserStats();
    setStats(userStats);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return null;
  }

  if (!stats) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Your Statistics</h3>
          <div className="text-xs text-muted-foreground">
            Session: {stats.sessionId.slice(0, 8)}...
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.visitCount}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total Visits
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.analyzedRepos}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Repos Analyzed
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.recentRepos.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Recent Repos
            </div>
          </div>
        </div>

        {stats.lastVisit > 0 && (
          <div className="mt-4 pt-4 border-t border-muted">
            <div className="text-xs text-muted-foreground">
              Last visit: {formatDate(stats.lastVisit)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
