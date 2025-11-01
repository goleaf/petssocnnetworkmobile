import { diffLines, Change } from "diff";

export type DiffBlockType = "added" | "removed" | "modified" | "unchanged";

export interface DiffBlock {
  id: string;
  type: DiffBlockType;
  oldStartLine: number;
  oldEndLine: number;
  newStartLine: number;
  newEndLine: number;
  oldContent: string;
  newContent: string;
  changes: Change[];
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  totalBlocks: number;
  description: string;
}

/**
 * Computes a deterministic diff between two texts.
 * Uses line-based diffing for consistent results.
 */
export function computeDiff(oldText: string, newText: string): DiffBlock[] {
  const changes = diffLines(oldText, newText);
  const rawBlocks: Array<{
    id: string;
    type: "added" | "removed" | "unchanged";
    oldStartLine: number;
    oldEndLine: number;
    newStartLine: number;
    newEndLine: number;
    oldContent: string;
    newContent: string;
    changes: Change[];
  }> = [];
  let oldLineNum = 1;
  let newLineNum = 1;
  let blockIdCounter = 0;

  // First pass: create raw blocks
  for (const change of changes) {
    const blockId = `block-${blockIdCounter++}`;
    const lines = change.value.split("\n");
    // Handle trailing newline: if value ends with \n, the last element is empty string
    const lineCount = change.value.length > 0
      ? (change.value.endsWith("\n") ? lines.length - 1 : lines.length)
      : 0;

    if (change.added) {
      rawBlocks.push({
        id: blockId,
        type: "added",
        oldStartLine: oldLineNum > 0 ? oldLineNum - 1 : 0,
        oldEndLine: oldLineNum > 0 ? oldLineNum - 1 : 0,
        newStartLine: newLineNum,
        newEndLine: lineCount > 0 ? newLineNum + lineCount - 1 : newLineNum,
        oldContent: "",
        newContent: change.value,
        changes: [change],
      });
      if (lineCount > 0) {
        newLineNum += lineCount;
      }
    } else if (change.removed) {
      rawBlocks.push({
        id: blockId,
        type: "removed",
        oldStartLine: oldLineNum,
        oldEndLine: lineCount > 0 ? oldLineNum + lineCount - 1 : oldLineNum,
        newStartLine: newLineNum > 0 ? newLineNum - 1 : 0,
        newEndLine: newLineNum > 0 ? newLineNum - 1 : 0,
        oldContent: change.value,
        newContent: "",
        changes: [change],
      });
      if (lineCount > 0) {
        oldLineNum += lineCount;
      }
    } else {
      // Unchanged
      rawBlocks.push({
        id: blockId,
        type: "unchanged",
        oldStartLine: oldLineNum,
        oldEndLine: lineCount > 0 ? oldLineNum + lineCount - 1 : oldLineNum,
        newStartLine: newLineNum,
        newEndLine: lineCount > 0 ? newLineNum + lineCount - 1 : newLineNum,
        oldContent: change.value,
        newContent: change.value,
        changes: [change],
      });
      if (lineCount > 0) {
        oldLineNum += lineCount;
        newLineNum += lineCount;
      }
    }
  }

  // Second pass: merge adjacent removed/added into modifications
  const processedBlocks: DiffBlock[] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const current = rawBlocks[i];
    const next = rawBlocks[i + 1];

    // Check if we should merge removed+added or added+removed into a modification
    if (
      current.type === "removed" &&
      next?.type === "added" &&
      current.oldEndLine >= current.oldStartLine &&
      next.newStartLine <= next.newEndLine
    ) {
      // Merge into modification
      processedBlocks.push({
        id: `${current.id}-${next.id}`,
        type: "modified",
        oldStartLine: current.oldStartLine,
        oldEndLine: current.oldEndLine,
        newStartLine: next.newStartLine,
        newEndLine: next.newEndLine,
        oldContent: current.oldContent,
        newContent: next.newContent,
        changes: [...current.changes, ...next.changes],
      });
      i++; // Skip next block
    } else {
      // Keep as-is
      processedBlocks.push({
        ...current,
        type: current.type as DiffBlockType,
      });
    }
  }

  return processedBlocks;
}

/**
 * Generates a human-readable summary of changes.
 */
export function generateDiffSummary(blocks: DiffBlock[]): DiffSummary {
  const stats = {
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0,
  };

  for (const block of blocks) {
    switch (block.type) {
      case "added":
        stats.added++;
        break;
      case "removed":
        stats.removed++;
        break;
      case "modified":
        stats.modified++;
        break;
      case "unchanged":
        stats.unchanged++;
        break;
    }
  }

  const parts: string[] = [];
  if (stats.added > 0) {
    parts.push(`${stats.added} block${stats.added !== 1 ? "s" : ""} added`);
  }
  if (stats.removed > 0) {
    parts.push(`${stats.removed} block${stats.removed !== 1 ? "s" : ""} removed`);
  }
  if (stats.modified > 0) {
    parts.push(`${stats.modified} block${stats.modified !== 1 ? "s" : ""} modified`);
  }
  if (parts.length === 0) {
    parts.push("No changes");
  }

  const description = parts.join(", ") + ".";

  return {
    ...stats,
    totalBlocks: blocks.length,
    description,
  };
}

/**
 * Gets the line numbers for a block in a format suitable for display.
 */
export function getBlockLineRange(block: DiffBlock, side: "old" | "new"): {
  start: number;
  end: number;
} {
  if (side === "old") {
    return {
      start: block.oldStartLine,
      end: block.oldEndLine,
    };
  }
  return {
    start: block.newStartLine,
    end: block.newEndLine,
  };
}

