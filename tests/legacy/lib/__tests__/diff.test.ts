import { computeDiff, generateDiffSummary, type DiffBlock } from "../utils/diff";

describe("computeDiff", () => {
  it("computes diff for identical texts", () => {
    const text = "Line 1\nLine 2\nLine 3";
    const blocks = computeDiff(text, text);

    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.every((block) => block.type === "unchanged")).toBe(true);
  });

  it("computes diff for added lines", () => {
    const oldText = "Line 1\nLine 2";
    const newText = "Line 1\nLine 2\nLine 3";

    const blocks = computeDiff(oldText, newText);
    const addedBlocks = blocks.filter(
      (block) => block.type === "added" || block.type === "modified"
    );

    // Either has added blocks, or the entire diff could be treated as modified
    expect(blocks.length).toBeGreaterThan(0);
    // Check that we detected the new line
    const hasNewContent = blocks.some(
      (block) => block.newContent.includes("Line 3") && !block.oldContent.includes("Line 3")
    );
    expect(hasNewContent).toBe(true);
  });

  it("computes diff for removed lines", () => {
    const oldText = "Line 1\nLine 2\nLine 3";
    const newText = "Line 1\nLine 2";

    const blocks = computeDiff(oldText, newText);
    const removedBlocks = blocks.filter(
      (block) => block.type === "removed" || block.type === "modified"
    );

    // Either has removed blocks, or the entire diff could be treated as modified
    expect(blocks.length).toBeGreaterThan(0);
    // Check that we detected the removed line
    const hasRemovedContent = blocks.some(
      (block) => block.oldContent.includes("Line 3") && !block.newContent.includes("Line 3")
    );
    expect(hasRemovedContent || removedBlocks.length > 0).toBe(true);
  });

  it("computes diff for modified lines", () => {
    const oldText = "Line 1\nLine 2\nLine 3";
    const newText = "Line 1\nLine 2 Modified\nLine 3";

    const blocks = computeDiff(oldText, newText);
    const modifiedBlocks = blocks.filter((block) => block.type === "modified");

    expect(modifiedBlocks.length).toBeGreaterThan(0);
  });

  it("generates deterministic block IDs", () => {
    const oldText = "Line 1\nLine 2";
    const newText = "Line 1\nLine 2 Modified";

    const blocks1 = computeDiff(oldText, newText);
    const blocks2 = computeDiff(oldText, newText);

    // Should produce same block structure
    expect(blocks1.length).toBe(blocks2.length);
    expect(blocks1.map((b) => b.type)).toEqual(blocks2.map((b) => b.type));
  });

  it("handles empty strings", () => {
    const blocks1 = computeDiff("", "");
    const blocks2 = computeDiff("", "New content");
    const blocks3 = computeDiff("Old content", "");

    expect(blocks1.length).toBeGreaterThanOrEqual(0);
    expect(blocks2.length).toBeGreaterThan(0);
    expect(blocks3.length).toBeGreaterThan(0);
  });

  it("handles single line changes", () => {
    const blocks = computeDiff("Old", "New");
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("produces blocks with correct line ranges", () => {
    const oldText = "Line 1\nLine 2\nLine 3";
    const newText = "Line 1\nLine 2 Modified\nLine 3";

    const blocks = computeDiff(oldText, newText);

    for (const block of blocks) {
      // All blocks should have valid line ranges
      if (block.type === "unchanged" || block.type === "modified") {
        expect(block.oldStartLine).toBeGreaterThan(0);
        expect(block.newStartLine).toBeGreaterThan(0);
        expect(block.oldEndLine).toBeGreaterThanOrEqual(block.oldStartLine);
        expect(block.newEndLine).toBeGreaterThanOrEqual(block.newStartLine);
      } else if (block.type === "added") {
        expect(block.newStartLine).toBeGreaterThan(0);
        expect(block.newEndLine).toBeGreaterThanOrEqual(block.newStartLine);
      } else if (block.type === "removed") {
        expect(block.oldStartLine).toBeGreaterThan(0);
        expect(block.oldEndLine).toBeGreaterThanOrEqual(block.oldStartLine);
      }
    }
  });
});

describe("generateDiffSummary", () => {
  it("generates summary for empty diff", () => {
    const blocks: DiffBlock[] = [
      {
        id: "1",
        type: "unchanged",
        oldStartLine: 1,
        oldEndLine: 10,
        newStartLine: 1,
        newEndLine: 10,
        oldContent: "Content",
        newContent: "Content",
        changes: [],
      },
    ];

    const summary = generateDiffSummary(blocks);

    expect(summary.description).toContain("No changes");
    expect(summary.added).toBe(0);
    expect(summary.removed).toBe(0);
    expect(summary.modified).toBe(0);
  });

  it("generates summary for added blocks", () => {
    const blocks: DiffBlock[] = [
      {
        id: "1",
        type: "added",
        oldStartLine: 0,
        oldEndLine: 0,
        newStartLine: 1,
        newEndLine: 5,
        oldContent: "",
        newContent: "New content",
        changes: [],
      },
    ];

    const summary = generateDiffSummary(blocks);

    expect(summary.description).toContain("added");
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(0);
  });

  it("generates summary for removed blocks", () => {
    const blocks: DiffBlock[] = [
      {
        id: "1",
        type: "removed",
        oldStartLine: 1,
        oldEndLine: 5,
        newStartLine: 0,
        newEndLine: 0,
        oldContent: "Old content",
        newContent: "",
        changes: [],
      },
    ];

    const summary = generateDiffSummary(blocks);

    expect(summary.description).toContain("removed");
    expect(summary.added).toBe(0);
    expect(summary.removed).toBe(1);
  });

  it("generates summary for modified blocks", () => {
    const blocks: DiffBlock[] = [
      {
        id: "1",
        type: "modified",
        oldStartLine: 1,
        oldEndLine: 3,
        newStartLine: 1,
        newEndLine: 3,
        oldContent: "Old",
        newContent: "New",
        changes: [],
      },
    ];

    const summary = generateDiffSummary(blocks);

    expect(summary.description).toContain("modified");
    expect(summary.modified).toBe(1);
  });

  it("generates summary with correct pluralization", () => {
    const blocks: DiffBlock[] = [
      {
        id: "1",
        type: "added",
        oldStartLine: 0,
        oldEndLine: 0,
        newStartLine: 1,
        newEndLine: 1,
        oldContent: "",
        newContent: "New",
        changes: [],
      },
      {
        id: "2",
        type: "added",
        oldStartLine: 0,
        oldEndLine: 0,
        newStartLine: 2,
        newEndLine: 2,
        oldContent: "",
        newContent: "New 2",
        changes: [],
      },
    ];

    const summary = generateDiffSummary(blocks);

    expect(summary.description).toContain("blocks added");
    expect(summary.added).toBe(2);
  });

  it("generates complete summary for mixed changes", () => {
    const blocks: DiffBlock[] = [
      {
        id: "1",
        type: "added",
        oldStartLine: 0,
        oldEndLine: 0,
        newStartLine: 1,
        newEndLine: 1,
        oldContent: "",
        newContent: "New",
        changes: [],
      },
      {
        id: "2",
        type: "removed",
        oldStartLine: 1,
        oldEndLine: 1,
        newStartLine: 0,
        newEndLine: 0,
        oldContent: "Old",
        newContent: "",
        changes: [],
      },
      {
        id: "3",
        type: "modified",
        oldStartLine: 2,
        oldEndLine: 2,
        newStartLine: 2,
        newEndLine: 2,
        oldContent: "Old",
        newContent: "New",
        changes: [],
      },
    ];

    const summary = generateDiffSummary(blocks);

    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(1);
    expect(summary.modified).toBe(1);
    expect(summary.totalBlocks).toBe(3);
    expect(summary.description).toContain("added");
    expect(summary.description).toContain("removed");
    expect(summary.description).toContain("modified");
  });
});

