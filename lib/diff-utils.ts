import type { ContentDiff } from './types';

/**
 * Simple diff algorithm for text comparison
 * Returns HTML with added/deleted spans
 */
export function calculateDiff(oldText: string | null, newText: string | null): ContentDiff {
  const old = oldText || '';
  const new_ = newText || '';

  if (old === new_) {
    return {
      field: 'content',
      oldValue: old,
      newValue: new_,
      diffHtml: escapeHtml(new_),
    };
  }

  // Simple word-level diff
  const oldWords = old.split(/(\s+)/);
  const newWords = new_.split(/(\s+)/);
  
  const diff = computeWordDiff(oldWords, newWords);
  
  return {
    field: 'content',
    oldValue: old,
    newValue: new_,
    diffHtml: diff,
  };
}

function computeWordDiff(oldWords: string[], newWords: string[]): string {
  const maxLen = Math.max(oldWords.length, newWords.length);
  let oldIdx = 0;
  let newIdx = 0;
  let html = '';

  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    if (oldIdx >= oldWords.length) {
      // Only new words remaining
      html += `<span class="diff-added">${escapeHtml(newWords[newIdx])}</span>`;
      newIdx++;
    } else if (newIdx >= newWords.length) {
      // Only old words remaining
      html += `<span class="diff-removed">${escapeHtml(oldWords[oldIdx])}</span>`;
      oldIdx++;
    } else if (oldWords[oldIdx] === newWords[newIdx]) {
      // Words match
      html += escapeHtml(oldWords[oldIdx]);
      oldIdx++;
      newIdx++;
    } else {
      // Words differ - look ahead for matches
      const lookAhead = findNextMatch(oldWords, newWords, oldIdx, newIdx);
      
      if (lookAhead.found) {
        // Add deleted words
        for (let i = oldIdx; i < lookAhead.oldPos; i++) {
          html += `<span class="diff-removed">${escapeHtml(oldWords[i])}</span>`;
        }
        // Add inserted words
        for (let i = newIdx; i < lookAhead.newPos; i++) {
          html += `<span class="diff-added">${escapeHtml(newWords[i])}</span>`;
        }
        oldIdx = lookAhead.oldPos;
        newIdx = lookAhead.newPos;
      } else {
        // No match found, just mark as changed
        html += `<span class="diff-removed">${escapeHtml(oldWords[oldIdx])}</span>`;
        html += `<span class="diff-added">${escapeHtml(newWords[newIdx])}</span>`;
        oldIdx++;
        newIdx++;
      }
    }
  }

  return html;
}

function findNextMatch(
  oldWords: string[],
  newWords: string[],
  oldStart: number,
  newStart: number
): { found: boolean; oldPos: number; newPos: number } {
  const maxLookAhead = 10;
  
  for (let i = 1; i <= maxLookAhead && oldStart + i < oldWords.length; i++) {
    for (let j = 1; j <= maxLookAhead && newStart + j < newWords.length; j++) {
      if (oldWords[oldStart + i] === newWords[newStart + j]) {
        return { found: true, oldPos: oldStart + i, newPos: newStart + j };
      }
    }
  }
  
  return { found: false, oldPos: oldStart + 1, newPos: newStart + 1 };
}

function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for server-side
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extract links from text content
 */
export function extractLinks(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Compare two objects and return diffs for changed fields
 */
export function compareObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): ContentDiff[] {
  const diffs: ContentDiff[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (oldValue !== newValue) {
      const oldStr = oldValue === null || oldValue === undefined ? null : String(oldValue);
      const newStr = newValue === null || newValue === undefined ? null : String(newValue);
      
      const diff = calculateDiff(oldStr, newStr);
      diff.field = key;
      diffs.push(diff);
    }
  }

  return diffs;
}

