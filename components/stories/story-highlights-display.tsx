'use client';

/**
 * Story Highlights Display Component
 * 
 * Displays story highlights as circular icons below profile bio.
 * Clicking a highlight opens the highlight viewer.
 * 
 * Requirements: 9.4
 */

import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StoryHighlightSelector } from './story-highlight-selector';
import { StoryHighlightViewer } from './story-highlight-viewer';
import { StoryHighlightEditor } from './story-highlight-editor';

interface Highlight {
  id: string;
  userId: string;
  name: string;
  coverUrl: string;
  storyIds: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface StoryHighlightsDisplayProps {
  userId: string;
  isOwnProfile: boolean;
}

export function StoryHighlightsDisplay({
  userId,
  isOwnProfile,
}: StoryHighlightsDisplayProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [viewingHighlight, setViewingHighlight] = useState<Highlight | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    fetchHighlights();
  }, [userId]);

  const fetchHighlights = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/stories/highlights?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setHighlights(data.highlights || []);
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    if (!confirm('Are you sure you want to delete this highlight?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stories/highlights/${highlightId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        setHighlights(prev => prev.filter(h => h.id !== highlightId));
      }
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (highlights.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <>
      <div className="py-4 border-t">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Create New Highlight Button (only for own profile) */}
          {isOwnProfile && (
            <button
              onClick={() => setShowSelector(true)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center group-hover:border-primary transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-primary">
                New
              </span>
            </button>
          )}

          {/* Existing Highlights */}
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="flex flex-col items-center gap-2 flex-shrink-0 group relative"
            >
              <button
                onClick={() => setViewingHighlight(highlight)}
                className="relative"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-muted ring-2 ring-background">
                  <img
                    src={highlight.coverUrl}
                    alt={highlight.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
              
              <div className="flex items-center gap-1">
                <span className="text-xs text-center max-w-[64px] truncate">
                  {highlight.name}
                </span>
                
                {/* Edit/Delete Menu (only for own profile) */}
                {isOwnProfile && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingHighlight(highlight)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteHighlight(highlight.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Highlight Selector Dialog */}
      {showSelector && (
        <StoryHighlightSelector
          open={showSelector}
          onClose={() => setShowSelector(false)}
          onSuccess={() => {
            fetchHighlights();
          }}
          userId={userId}
        />
      )}

      {/* Highlight Viewer */}
      {viewingHighlight && (
        <StoryHighlightViewer
          highlight={viewingHighlight}
          onClose={() => setViewingHighlight(null)}
        />
      )}

      {/* Highlight Editor */}
      {editingHighlight && (
        <StoryHighlightEditor
          highlight={editingHighlight}
          open={!!editingHighlight}
          onClose={() => setEditingHighlight(null)}
          onSuccess={() => {
            fetchHighlights();
            setEditingHighlight(null);
          }}
          userId={userId}
        />
      )}
    </>
  );
}
