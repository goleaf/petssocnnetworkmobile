'use client';

/**
 * Story Highlight Viewer Component
 * 
 * Displays stories in a highlight in sequence, similar to regular story viewer.
 * 
 * Requirements: 9.4
 */

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Story {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: string;
  caption?: string;
  createdAt: string;
  videoDuration?: number;
}

interface Highlight {
  id: string;
  name: string;
  coverUrl: string;
  storyIds: string[];
}

interface StoryHighlightViewerProps {
  highlight: Highlight;
  onClose: () => void;
}

export function StoryHighlightViewer({
  highlight,
  onClose,
}: StoryHighlightViewerProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighlightStories();
  }, [highlight.id]);

  const fetchHighlightStories = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/stories/highlights/${highlight.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching highlight stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <p>No stories in this highlight</p>
          <Button
            variant="outline"
            onClick={onClose}
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
              <img
                src={highlight.coverUrl}
                alt={highlight.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white font-semibold">
              {highlight.name}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Progress Bars */}
        <div className="flex gap-1 mt-4">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  index < currentIndex
                    ? 'w-full'
                    : index === currentIndex
                    ? 'w-full'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Story Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentStory.mediaType === 'video' ? (
          <video
            src={currentStory.mediaUrl}
            className="max-w-full max-h-full"
            controls
            autoPlay
            onEnded={goToNext}
          />
        ) : (
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.caption || 'Story'}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-center">{currentStory.caption}</p>
        </div>
      )}

      {/* Navigation Areas */}
      <div className="absolute inset-0 flex">
        {/* Left tap area */}
        <button
          onClick={goToPrevious}
          className="flex-1 cursor-pointer"
          disabled={currentIndex === 0}
        >
          {currentIndex > 0 && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
              <ChevronLeft className="h-8 w-8 text-white" />
            </div>
          )}
        </button>

        {/* Right tap area */}
        <button
          onClick={goToNext}
          className="flex-1 cursor-pointer"
        >
          {currentIndex < stories.length - 1 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
              <ChevronRight className="h-8 w-8 text-white" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
