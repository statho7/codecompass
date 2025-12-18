'use client';

/**
 * Recent Repositories Component
 * Displays recently analyzed repositories with quick access
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserStats } from '@/lib/cookies/client';
import { Clock } from 'lucide-react';

interface RecentReposProps {
  onSelect: (url: string) => void;
}

export function RecentRepos({ onSelect }: RecentReposProps) {
  const [recentRepos, setRecentRepos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read recent repos from cookies
    const stats = getUserStats();
    if (stats && stats.recentRepos.length > 0) {
      setRecentRepos(stats.recentRepos);
    }
    setIsLoading(false);
  }, []);

  if (isLoading || recentRepos.length === 0) {
    return null;
  }

  const extractRepoName = (url: string) => {
    try {
      // Extract owner/repo from GitHub URL
      const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
      if (match) {
        return match[1];
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Repositories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentRepos.map((repo, index) => (
            <Button
              key={`${repo}-${index}`}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left font-mono text-xs"
              onClick={() => onSelect(repo)}
            >
              <span className="truncate">{extractRepoName(repo)}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
