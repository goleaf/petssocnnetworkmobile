'use client';

/**
 * Story Insights Component
 * Displays comprehensive analytics for a story
 * 
 * Requirements: 10.2, 10.3
 */

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface StoryInsights {
  totalViews: number;
  reach: number;
  impressions: number;
  completionRate: number;
  averageWatchTime: number;
  exitsHeatmap: Array<{
    second: number;
    exitCount: number;
    exitPercentage: number;
  }>;
  engagement: {
    replies: number;
    reactions: number;
    shares: number;
    pollVotes: number;
    questionResponses: number;
    quizAnswers: number;
    linkClicks: number;
    totalInteractions: number;
  };
  audience: {
    followerViewers: number;
    nonFollowerViewers: number;
    followerPercentage: number;
    geographicDistribution: Array<{
      country: string;
      count: number;
      percentage: number;
    }>;
    deviceTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  performance: {
    viewsVsAverage: number;
    engagementVsAverage: number;
    completionRateVsAverage: number;
  };
  storyMetadata: {
    createdAt: string;
    expiresAt: string;
    mediaType: string;
    videoDuration?: number;
    hasCaption: boolean;
    stickerCount: number;
    visibility: string;
  };
}

interface StoryInsightsProps {
  storyId: string;
  onClose?: () => void;
}

export function StoryInsights({ storyId, onClose }: StoryInsightsProps) {
  const [insights, setInsights] = useState<StoryInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [storyId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stories/${storyId}/insights`, {
        headers: {
          'x-user-id': 'user-1', // TODO: Get from auth context
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <button
          onClick={fetchInsights}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-2xl font-bold">Story Insights</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Key Metrics */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Views"
              value={insights.totalViews}
              icon="👁️"
            />
            <MetricCard
              label="Reach"
              value={insights.reach}
              subtitle="unique viewers"
              icon="📊"
            />
            <MetricCard
              label="Completion Rate"
              value={`${insights.completionRate.toFixed(1)}%`}
              icon="✅"
            />
            <MetricCard
              label="Avg Watch Time"
              value={`${insights.averageWatchTime.toFixed(1)}s`}
              icon="⏱️"
            />
          </div>
        </section>

        {/* Engagement Breakdown */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Engagement</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <EngagementRow label="Replies" value={insights.engagement.replies} />
            <EngagementRow label="Reactions" value={insights.engagement.reactions} />
            <EngagementRow label="Shares" value={insights.engagement.shares} />
            <EngagementRow label="Poll Votes" value={insights.engagement.pollVotes} />
            <EngagementRow label="Question Responses" value={insights.engagement.questionResponses} />
            <EngagementRow label="Quiz Answers" value={insights.engagement.quizAnswers} />
            <EngagementRow label="Link Clicks" value={insights.engagement.linkClicks} />
            <div className="pt-3 border-t border-gray-200">
              <EngagementRow
                label="Total Interactions"
                value={insights.engagement.totalInteractions}
                bold
              />
            </div>
          </div>
        </section>

        {/* Exits Heatmap */}
        {insights.exitsHeatmap.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Drop-off Points</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Percentage of viewers who left at each second
              </p>
              <div className="space-y-2">
                {insights.exitsHeatmap.map((exit) => (
                  <div key={exit.second} className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-12">{exit.second}s</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all"
                        style={{ width: `${exit.exitPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {exit.exitPercentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Audience Insights */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Audience</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Follower vs Non-follower */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Follower Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Followers</span>
                  <span className="text-sm font-medium">
                    {insights.audience.followerViewers} ({insights.audience.followerPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Non-followers</span>
                  <span className="text-sm font-medium">
                    {insights.audience.nonFollowerViewers}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Types */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Device Types</h4>
              <div className="space-y-2">
                {insights.audience.deviceTypes.map((device) => (
                  <div key={device.type} className="flex justify-between">
                    <span className="text-sm capitalize">{device.type}</span>
                    <span className="text-sm font-medium">
                      {device.count} ({device.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Story Metadata */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Story Details</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Created</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(insights.storyMetadata.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expires</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(insights.storyMetadata.expiresAt), { addSuffix: true })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Media Type</span>
              <span className="font-medium capitalize">{insights.storyMetadata.mediaType}</span>
            </div>
            {insights.storyMetadata.videoDuration && (
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{insights.storyMetadata.videoDuration}s</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Stickers</span>
              <span className="font-medium">{insights.storyMetadata.stickerCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Visibility</span>
              <span className="font-medium capitalize">{insights.storyMetadata.visibility.replace('_', ' ')}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Helper Components

function MetricCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function EngagementRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-semibold' : 'text-gray-700'}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}
