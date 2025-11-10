'use client';

/**
 * Story Highlight Editor Component
 * 
 * Allows users to edit existing highlights: add/remove stories, change cover, change name.
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
import { Check, Loader2, X } from 'lucide-react';

interface Story {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: string;
  caption?: string;
  createdAt: string;
  archivedAt?: string;
}

interface Highlight {
  id: string;
  userId: string;
  name: string;
  coverUrl: string;
  storyIds: string[];
  order: number;
}

interface StoryHighlightEditorProps {
  highlight: Highlight;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string;
}

export function StoryHighlightEditor({
  highlight,
  open,
  onClose,
  onSuccess,
  userId,
}: StoryHighlightEditorProps) {
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>(highlight.storyIds);
  const [coverStoryId, setCoverStoryId] = useState<string | null>(null);
  const [highlightName, setHighlightName] = useState(highlight.name);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize cover story ID from current highlight
  useEffect(() => {
    if (highlight.storyIds.length > 0) {
      // Try to find which story is the current cover
      // For now, default to first story
      setCoverStoryId(highlight.storyIds[0]);
    }
  }, [highlight]);

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
      setAllStories(data.stories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const toggleStorySelection = (storyId: string) => {
    setSelectedStoryIds(prev => {
      if (prev.includes(storyId)) {
        const newIds = prev.filter(id => id !== storyId);
        // If removing the cover story, select a new cover
        if (coverStoryId === storyId && newIds.length > 0) {
          setCoverStoryId(newIds[0]);
        }
        return newIds;
      } else {
        return [...prev, storyId];
      }
    });
  };

  const removeStory = (storyId: string) => {
    setSelectedStoryIds(prev => {
      const newIds = prev.filter(id => id !== storyId);
      // If removing the cover story, select a new cover
      if (coverStoryId === storyId && newIds.length > 0) {
        setCoverStoryId(newIds[0]);
      }
      return newIds;
    });
  };

  const handleSaveChanges = async () => {
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

    setSaving(true);
    setError(null);

    try {
      const coverStory = allStories.find(s => s.id === coverStoryId);
      
      const response = await fetch(`/api/stories/highlights/${highlight.id}`, {
        method: 'PATCH',
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
        throw new Error(data.error || 'Failed to update highlight');
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update highlight');
    } finally {
      setSaving(false);
    }
  };

  // Get currently selected stories
  const selectedStories = allStories.filter(s => selectedStoryIds.includes(s.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Highlight</DialogTitle>
          <DialogDescription>
            Modify your highlight name, cover, or stories
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

          {/* Currently Selected Stories */}
          <div className="space-y-2">
            <Label>Selected Stories ({selectedStories.length})</Label>
            <div className="h-[120px] border rounded-md p-4 overflow-x-auto">
              <div className="flex gap-2">
                {selectedStories.map((story) => (
                  <div
                    key={story.id}
                    className="relative flex-shrink-0 group"
                  >
                    <div className="w-16 h-28 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={story.thumbnailUrl || story.mediaUrl}
                        alt={story.caption || 'Story'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Cover Indicator */}
                    {coverStoryId === story.id && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded">
                        Cover
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeStory(story.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>

                    {/* Set as Cover Button */}
                    {coverStoryId !== story.id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-1 left-1 right-1 text-xs py-0 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setCoverStoryId(story.id)}
                      >
                        Set Cover
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add More Stories */}
          <div className="space-y-2">
            <Label>Add More Stories</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="h-[200px] border rounded-md p-4 overflow-y-auto">
                <div className="grid grid-cols-4 gap-4">
                  {allStories
                    .filter(s => !selectedStoryIds.includes(s.id))
                    .map((story) => (
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
                        
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 bg-primary rounded-full p-1">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
