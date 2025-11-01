"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";
import { computeDiff, generateDiffSummary } from "@/lib/utils/diff";
import { cn } from "@/lib/utils";

export interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  leftTitle?: string;
  rightTitle?: string;
  revisionSummary?: string;
  onSummaryChange?: (summary: string) => void;
  className?: string;
  showCopyButton?: boolean;
}

export function DiffViewer({
  oldValue,
  newValue,
  leftTitle = "Before",
  rightTitle = "After",
  revisionSummary: initialRevisionSummary,
  onSummaryChange,
  className,
  showCopyButton = true,
}: DiffViewerProps) {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [revisionSummary, setRevisionSummary] = useState(initialRevisionSummary || "");
  const [copied, setCopied] = useState(false);
  const diffViewerRef = useRef<HTMLDivElement>(null);

  // Compute diff blocks with deterministic highlighting
  const diffBlocks = useMemo(() => computeDiff(oldValue, newValue), [oldValue, newValue]);

  // Generate "what changed" summary
  const changeSummary = useMemo(() => generateDiffSummary(diffBlocks), [diffBlocks]);

  // Get only changed blocks for navigation
  const changedBlocks = useMemo(
    () =>
      diffBlocks
        .map((block, index) => ({ block, index }))
        .filter(({ block }) => block.type !== "unchanged"),
    [diffBlocks]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        navigateNext();
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        navigatePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changedBlocks.length]);

  const navigateNext = useCallback(() => {
    if (changedBlocks.length === 0) return;

    setSelectedBlockIndex((prev) => {
      if (prev === null) return 0;
      return prev < changedBlocks.length - 1 ? prev + 1 : 0;
    });
  }, [changedBlocks.length]);

  const navigatePrevious = useCallback(() => {
    if (changedBlocks.length === 0) return;

    setSelectedBlockIndex((prev) => {
      if (prev === null) return changedBlocks.length - 1;
      return prev > 0 ? prev - 1 : changedBlocks.length - 1;
    });
  }, [changedBlocks.length]);

  // Scroll to selected block
  useEffect(() => {
    if (selectedBlockIndex === null) return;

    const selected = changedBlocks[selectedBlockIndex];
    if (!selected) return;

    // Find the block element and scroll to it
    const blockId = selected.block.id;
    const element = document.querySelector(`[data-diff-block-id="${blockId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedBlockIndex, changedBlocks]);

  // Copy summary to revision summary box
  const handleCopySummary = useCallback(() => {
    setRevisionSummary(changeSummary.description);
    onSummaryChange?.(changeSummary.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [changeSummary.description, onSummaryChange]);

  // Handle revision summary change
  const handleSummaryChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setRevisionSummary(value);
      onSummaryChange?.(value);
    },
    [onSummaryChange]
  );

  // Custom styles for deterministic highlighting
  const customStyles = useMemo(
    () => ({
      variables: {
        light: {
          diffViewerBackground: "#fff",
          diffViewerColor: "#212529",
          addedBackground: "#e6ffed",
          addedColor: "#24292e",
          removedBackground: "#ffeef0",
          removedColor: "#24292e",
          wordAddedBackground: "#acf2bd",
          wordRemovedBackground: "#fdb8c0",
          addedGutterBackground: "#cdffd8",
          removedGutterBackground: "#ffdce0",
          gutterBackground: "#f7f7f7",
          gutterBackgroundDark: "#f3f1f1",
          highlightBackground: "#fffbdd",
          highlightGutterBackground: "#fff5b1",
          codeFoldGutterBackground: "#dbedff",
          codeFoldBackground: "#f1f8ff",
          emptyLineBackground: "#fafbfc",
          gutterColor: "#212529",
          addedGutterColor: "#212529",
          removedGutterColor: "#212529",
          codeFoldContentColor: "#212529",
          diffViewerTitleBackground: "#fafbfc",
          diffViewerTitleColor: "#212529",
          diffViewerTitleBorderColor: "#eee",
        },
        dark: {
          diffViewerBackground: "#2e303c",
          diffViewerColor: "#FFF",
          addedBackground: "#044B53",
          addedColor: "white",
          removedBackground: "#632F34",
          removedColor: "white",
          wordAddedBackground: "#055d67",
          wordRemovedBackground: "#7d383f",
          addedGutterBackground: "#034148",
          removedGutterBackground: "#632b30",
          gutterBackground: "#2c2f3a",
          gutterBackgroundDark: "#262933",
          highlightBackground: "#2a3967",
          highlightGutterBackground: "#2d4077",
          codeFoldGutterBackground: "#21232b",
          codeFoldBackground: "#262831",
          emptyLineBackground: "#363946",
          gutterColor: "#464c67",
          addedGutterColor: "#8c8c8c",
          removedGutterColor: "#8c8c8c",
          codeFoldContentColor: "#555a7b",
          diffViewerTitleBackground: "#2f323e",
          diffViewerTitleColor: "#555a7b",
          diffViewerTitleBorderColor: "#353846",
        },
      },
      // Highlight selected block
      line: (lineId: string) => {
        const isSelected = changedBlocks.some(
          ({ block, index }) =>
            selectedBlockIndex === index &&
            (lineId.includes(block.oldStartLine.toString()) ||
              lineId.includes(block.newStartLine.toString()))
        );

        return {
          ...(isSelected && {
            backgroundColor: "#fff5b1",
            outline: "2px solid #ffcd3c",
            outlineOffset: "-2px",
          }),
        };
      },
    }),
    [changedBlocks, selectedBlockIndex]
  );

  // Highlight lines for selected block
  const highlightLines = useMemo(() => {
    if (selectedBlockIndex === null) return [];

    const selected = changedBlocks[selectedBlockIndex];
    if (!selected) return [];

    const { block } = selected;
    const lines: string[] = [];

    if (block.oldStartLine > 0 && block.oldEndLine > 0) {
      for (let i = block.oldStartLine; i <= block.oldEndLine; i++) {
        lines.push(`L-${i}`);
      }
    }

    if (block.newStartLine > 0 && block.newEndLine > 0) {
      for (let i = block.newStartLine; i <= block.newEndLine; i++) {
        lines.push(`R-${i}`);
      }
    }

    return lines;
  }, [selectedBlockIndex, changedBlocks]);

  // Performance optimization: Use memoized diff computation
  const diffViewerProps = useMemo(
    () => ({
      oldValue,
      newValue,
      splitView: true,
      leftTitle,
      rightTitle,
      compareMethod: DiffMethod.LINES,
      disableWordDiff: false,
      showDiffOnly: false,
      extraLinesSurroundingDiff: 3,
      styles: customStyles,
      highlightLines,
      onLineNumberClick: (lineId: string) => {
        // Find block by line number
        const match = lineId.match(/(L|R)-(\d+)/);
        if (match) {
          const side = match[1];
          const lineNum = parseInt(match[2], 10);

          const blockIndex = changedBlocks.findIndex(({ block }) => {
            if (side === "L") {
              return lineNum >= block.oldStartLine && lineNum <= block.oldEndLine;
            } else {
              return lineNum >= block.newStartLine && lineNum <= block.newEndLine;
            }
          });

          if (blockIndex !== -1) {
            setSelectedBlockIndex(blockIndex);
          }
        }
      },
    }),
    [oldValue, newValue, leftTitle, rightTitle, customStyles, highlightLines, changedBlocks]
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Diff Viewer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revision Diff</CardTitle>
            {changedBlocks.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {selectedBlockIndex !== null
                    ? `${selectedBlockIndex + 1} / ${changedBlocks.length}`
                    : `${changedBlocks.length} change${changedBlocks.length !== 1 ? "s" : ""}`}
                </span>
                <span className="text-xs">(Press j/k to navigate)</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={diffViewerRef} className="overflow-auto max-h-[600px]">
            <ReactDiffViewer {...diffViewerProps} />
          </div>
        </CardContent>
      </Card>

      {/* Summary and Revision Summary Box */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* What Changed Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">What Changed</CardTitle>
              {showCopyButton && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopySummary}
                  title="Copy summary to revision box"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium">{changeSummary.description}</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Added: {changeSummary.added}</span>
                <span>Removed: {changeSummary.removed}</span>
                <span>Modified: {changeSummary.modified}</span>
                <span>Unchanged: {changeSummary.unchanged}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revision Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revision Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={revisionSummary}
              onChange={handleSummaryChange}
              placeholder="Enter revision summary or click copy to use generated summary..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

