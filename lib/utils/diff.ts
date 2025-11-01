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
  const blocks: DiffBlock[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;
  let blockIdCounter = 0;

  for (const change of changes) {
    const blockId = `block-${blockIdCounter++}`;
    const lines = change.value.split("\n");
    const lineCount = lines.length - (change.value.endsWith("\n") ? 0 : 1);

    if (change.added) {
      blocks.push({
        id: blockId,
        type: "added",
        oldStartLine: oldLineNum - 1,
        oldEndLine: oldLineNum - 1,
        newStartLine: newLineNum,
        newEndLine: newLineNum + lineCount - 1,
        oldContent: "",
        newContent: change.value,
        changes: [change],
      });
      newLineNum += lineCount;
    } else if (change.removed) {
      blocks.push({
        id: blockId,
        type: "removed",
        oldStartLine: oldLineNum,
        oldEndLine: oldLineNum + lineCount - 1,
        newStartLine: newLineNum - 1,
        newEndLine: newLineNum - 1,
        oldContent: change.value,
        newContent: "",
        changes: [change],
      });
      oldLineNum += lineCount;
    } else {
      // Check if next change is a modification
      const nextChangeIdx = changes.indexOf(change) + 1;
      const nextChange = changes[nextChangeIdx];
      const prevChange = changes[nextChangeIdx - 2];

      // Detect modifications: removed followed by added (or vice versa)
      if (
        (prevChange?.removed && nextChange?.added) ||
        (prevChange?.added && nextChange?.removed)
      ) {
        // This is part of a modification block, skip for now
        oldLineNum += lineCount;
        newLineNum += lineCount;
        continue;
      }

      blocks.push({
        id: blockId,
        type: "unchanged",
        oldStartLine: oldLineNum,
        oldEndLine: oldLineNum + lineCount - 1,
        newStartLine: newLineNum,
        newEndLine: newLineNum + lineCount - 1,
        oldContent: change.value,
        newContent: change.value,
        changes: [change],
      });
      oldLineNum += lineCount;
      newLineNum += lineCount;
    }
  }

  // Post-process to merge adjacent removed/added blocks into modifications
  const processedBlocks: DiffBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];
    const next = blocks[i + 1];

    if (
      current.type === "removed" &&
      next?.type === "added" &&
      Math.abs(current.oldEndLine - next.newStartLine) <= 1
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
    } else if (
      current.type === "added" &&
      next?.type === "removed" &&
      Math.abs(current.newEndLine - next.oldStartLine) <= 1
    ) {
      // Merge into modification (added then removed)
      processedBlocks.push({
        id: `${next.id}-${current.id}`,
        type: "modified",
        oldStartLine: next.oldStartLine,
        oldEndLine: next.oldEndLine,
        newStartLine: current.newStartLine,
        newEndLine: current.newEndLine,
        oldContent: next.oldContent,
        newContent: current.newContent,
        changes: [...next.changes, ...current.changes],
      });
      i++; // Skip next block
    } else {
      processedBlocks.push(current);
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

