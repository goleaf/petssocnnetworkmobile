'use client';

/**
 * Story Analytics Modal
 * Modal wrapper for viewing story analytics with tabs for viewers and insights
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { useState } from 'react';
import { StoryViewersList } from './story-viewers-list';
import { StoryInsights } from './story-insights';

interface StoryAnalyticsModalProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'viewers' | 'insights';

export function StoryAnalyticsModal({
  storyId,
  isOpen,
  onClose,
}: StoryAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('insights');

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Insights
            </button>
            <button
              onClick={() => setActiveTab('viewers')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'viewers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Viewers
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'insights' ? (
              <StoryInsights storyId={storyId} onClose={onClose} />
            ) : (
              <StoryViewersList storyId={storyId} onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
