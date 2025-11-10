'use client';

/**
 * Story Viewers List Component
 * Displays list of users who viewed a story
 * 
 * Requirements: 10.1
 */

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface StoryViewer {
  userId: string;
  viewedAt: string;
  duration: number;
  completed: boolean;
}

interface StoryViewersListProps {
  storyId: string;
  onClose?: () => void;
}

export function StoryViewersList({ storyId, onClose }: StoryViewersListProps) {
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchViewers();
  }, [storyId]);

  const fetchViewers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/stories/${storyId}/viewers`, {
        headers: {
          'x-user-id': 'user-1', // TODO: Get from auth context
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch viewers');
      }

      const data = await response.json();
      setViewers(data.viewers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load viewers');
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
          onClick={fetchViewers}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          Viewers ({viewers.length})
        </h2>
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

      {/* Viewers list */}
      <div className="flex-1 overflow-y-auto">
        {viewers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No views yet</p>
          </div>
        ) : (
          <ul className="divide-y">
            {viewers.map((viewer) => (
              <li key={viewer.userId} className="p-4 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  {/* Avatar placeholder */}
                  <div className="w-10 h-10 rounded-full bg-gray-300 shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      User {viewer.userId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(viewer.viewedAt), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {viewer.completed ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {viewer.duration}s
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
