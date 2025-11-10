'use client';

/**
 * Story Archive Component
 * 
 * Displays archived stories grouped by month/year with pagination.
 * Allows reposting stories and exporting them.
 * 
 * Requirements: 9.3, 9.4
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, Share2 } from 'lucide-react';

interface Story {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: string;
  caption?: string;
  createdAt: string;
  archivedAt?: string;
}

interface GroupedStories {
  [key: string]: Story[];
}

interface StoryArchiveProps {
  userId: string;
}

export function StoryArchive({ userId }: StoryArchiveProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<GroupedStories>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArchive();
  }, [selectedYear, selectedMonth]);

  const fetchArchive = async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
      });

      if (cursor) {
        params.append('cursor', cursor);
      }

      if (selectedYear !== 'all') {
        params.append('year', selectedYear);
        if (selectedMonth !== 'all') {
          params.append('month', selectedMonth);
        }
      }

      const response = await fetch(`/api/stories/archive?${params}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch archived stories');
      }

      const data = await response.json();

      if (cursor) {
        setStories(prev => [...prev, ...data.stories]);
        setGroupedStories(prev => {
          const merged = { ...prev };
          Object.entries(data.groupedStories).forEach(([key, value]) => {
            if (merged[key]) {
              merged[key] = [...merged[key], ...(value as Story[])];
            } else {
              merged[key] = value as Story[];
            }
          });
          return merged;
        });
      } else {
        setStories(data.stories);
        setGroupedStories(data.groupedStories);
      }

      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load archive');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchArchive(nextCursor);
    }
  };

  const handleRepostStory = async (storyId: string) => {
    // TODO: Implement repost functionality
    console.log('Repost story:', storyId);
  };

  const handleExportStory = async (story: Story) => {
    // Download the story media
    try {
      const response = await fetch(story.mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-${story.id}.${story.mediaType === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting story:', error);
    }
  };

  // Get available years from stories
  const availableYears = Array.from(
    new Set(
      stories
        .filter(s => s.archivedAt)
        .map(s => new Date(s.archivedAt!).getFullYear())
    )
  ).sort((a, b) => b - a);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedYear !== 'all' && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Grouped Stories */}
      {Object.keys(groupedStories).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No archived stories found
        </div>
      ) : (
        <div className="h-[600px] overflow-y-auto">
          <div className="space-y-8">
            {Object.entries(groupedStories)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([monthKey, monthStories]) => {
                const [year, month] = monthKey.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });

                return (
                  <div key={monthKey}>
                    <h3 className="text-lg font-semibold mb-4">
                      {monthName} {year}
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {monthStories.map((story) => (
                        <div
                          key={story.id}
                          className="relative group cursor-pointer"
                        >
                          <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted">
                            <img
                              src={story.thumbnailUrl || story.mediaUrl}
                              alt={story.caption || 'Story'}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRepostStory(story.id)}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              Repost
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleExportStory(story)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
