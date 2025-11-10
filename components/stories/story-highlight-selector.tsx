'use client';

/**
 * Story Highlight Selector Component
 * 
 * Allows users to create highlights by selecting stories from archive,
 * choosing a cover photo, and naming the highlight.
 * 
 * Requirements: 9.4
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Loader2 } from 'lucide-react';

interface Story {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: string;
  caption?: string;
  createdAt: string;
  archivedAt?: string;
}

interface StoryHighlightSelectorProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (highlight: any) => void;
  userId: string;
}

export function StoryHighlightSelector({
  open,
  onClose,
  onSuccess,
  userId,
}: StoryHighlightSelectorProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [coverStoryId, setCoverStoryId] = useState<string | null>(null);
  const [highlightName, setHighlightName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch archived stories
  useEffect(() => {
    if (open) {
      fetchArchivedStories();
    }
  }, [open]);

  const fetchArchivedStories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stories/archive', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch archived stories');
      }

      const data = await response.json();
      setStories(data.stories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const toggleStorySelection = (storyId: string) => {
    setSelectedStoryIds(prev => {
      if (prev.includes(storyId)) {
        return prev.filter(id => id !== storyId);
      } else {
        return [...prev, storyId];
      }
    });

    // Auto-select first story as cover if none selected
    if (!coverStoryId && !selectedStoryIds.includes(storyId)) {
      setCoverStoryId(storyId);
    }
  };

  const handleCreateHighlight = async () => {
    if (!highlightName.trim()) {
      setError('Please enter a highlight name');
      return;
    }

    if (highlightName.length > 15) {
      setError('Highlight name must be 15 characters or less');
      return;
    }

    if (selectedStoryIds.length === 0) {
      setError('Please select at least one story');
      return;
    }

    if (!coverStoryId) {
      setError('Please select a cover photo');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const coverStory = stories.find(s => s.id === coverStoryId);
      
      const response = await fetch('/api/stories/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          name: highlightName.trim(),
          coverUrl: coverStory?.thumbnailUrl || coverStory?.mediaUrl,
          storyIds: selectedStoryIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create highlight');
      }

      const data = await response.json();
      
      if (onSuccess) {
        onSuccess(data.highlight);
      }

      // Reset form
      setHighlightName('');
      setSelectedStoryIds([]);
      setCoverStoryId(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create highlight');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Create Story Highlight</DialogTitle>
          <DialogDescription>
            Select stories from your archive to create a permanent highlight
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Highlight Name Input */}
          <div className="space-y-2">
            <Label htmlFor="highlight-name">
              Highlight Name (max 15 characters)
            </Label>
            <Input
              id="highlight-name"
              value={highlightName}
              onChange={(e) => setHighlightName(e.target.value)}
              placeholder="Enter highlight name"
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">
              {highlightName.length}/15 characters
            </p>
          </div>

          {/* Story Selection */}
          <div className="space-y-2">
            <Label>Select Stories</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : stories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No archived stories available
              </p>
            ) : (
              <div className="h-[300px] border rounded-md p-4 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  {stories.map((story) => (
                    <div
                      key={story.id}
                      className="relative cursor-pointer group"
                      onClick={() => toggleStorySelection(story.id)}
                    >
                      <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted">
                        <img
                          src={story.thumbnailUrl || story.mediaUrl}
                          alt={story.caption || 'Story'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Selection Indicator */}
                      {selectedStoryIds.includes(story.id) && (
                        <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center">
                          <div className="bg-primary rounded-full p-1">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}

                      {/* Cover Indicator */}
                      {coverStoryId === story.id && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Cover
                        </div>
                      )}

                      {/* Set as Cover Button */}
                      {selectedStoryIds.includes(story.id) && coverStoryId !== story.id && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverStoryId(story.id);
                          }}
                        >
                          Set as Cover
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Selected Count */}
          {selectedStoryIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedStoryIds.length} {selectedStoryIds.length === 1 ? 'story' : 'stories'} selected
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreateHighlight} disabled={creating || loading}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Highlight'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
