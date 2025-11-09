import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiffViewer } from "../diff-viewer";

// Mock react-diff-viewer-continued
jest.mock("react-diff-viewer-continued", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: jest.fn(({ oldValue, newValue, leftTitle, rightTitle, highlightLines }) => (
      <div data-testid="diff-viewer">
        <div data-testid="old-value">{oldValue}</div>
        <div data-testid="new-value">{newValue}</div>
        <div data-testid="left-title">{leftTitle}</div>
        <div data-testid="right-title">{rightTitle}</div>
        <div data-testid="highlight-lines">{JSON.stringify(highlightLines || [])}</div>
      </div>
    )),
    DiffMethod: {
      LINES: "diffLines",
      CHARS: "diffChars",
      WORDS: "diffWords",
    },
  };
});

describe("DiffViewer", () => {
  const oldText = `Line 1
Line 2
Line 3
Line 4`;

  const newText = `Line 1
Line 2 Modified
Line 3
Line 5 Added`;

  it("renders diff viewer with side-by-side display", () => {
    render(<DiffViewer oldValue={oldText} newValue={newText} />);

    expect(screen.getByTestId("diff-viewer")).toBeInTheDocument();
    // Text content normalization removes newlines, so we check for key content
    expect(screen.getByTestId("old-value").textContent).toContain("Line 1");
    expect(screen.getByTestId("old-value").textContent).toContain("Line 4");
    expect(screen.getByTestId("new-value").textContent).toContain("Line 1");
    expect(screen.getByTestId("new-value").textContent).toContain("Line 5");
  });

  it("shows custom titles", () => {
    render(
      <DiffViewer
        oldValue={oldText}
        newValue={newText}
        leftTitle="Before"
        rightTitle="After"
      />
    );

    expect(screen.getByTestId("left-title")).toHaveTextContent("Before");
    expect(screen.getByTestId("right-title")).toHaveTextContent("After");
  });

  it("displays what changed summary", () => {
    render(<DiffViewer oldValue={oldText} newValue={newText} />);

    expect(screen.getByText(/What Changed/i)).toBeInTheDocument();
    expect(screen.getByText(/Added:/i)).toBeInTheDocument();
    expect(screen.getByText(/Removed:/i)).toBeInTheDocument();
    expect(screen.getByText(/Modified:/i)).toBeInTheDocument();
  });

  it("displays revision summary textarea", () => {
    render(<DiffViewer oldValue={oldText} newValue={newText} />);

    const textarea = screen.getByPlaceholderText(
      /Enter revision summary/i
    ) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
  });

  it("copies summary to revision summary box", async () => {
    const user = userEvent.setup();
    const onSummaryChange = jest.fn();

    render(
      <DiffViewer
        oldValue={oldText}
        newValue={newText}
        onSummaryChange={onSummaryChange}
      />
    );

    const copyButton = screen.getByTitle(/Copy summary to revision box/i);
    await user.click(copyButton);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        /Enter revision summary/i
      ) as HTMLTextAreaElement;
      expect(textarea.value).toContain("block");
    });

    expect(onSummaryChange).toHaveBeenCalled();
  });

  it("handles keyboard navigation with j/k keys", async () => {
    render(<DiffViewer oldValue={oldText} newValue={newText} />);

    // Press 'j' to navigate next
    fireEvent.keyDown(document, { key: "j", code: "KeyJ" });

    await waitFor(() => {
      expect(screen.getByText(/1 \/ \d+/)).toBeInTheDocument();
    });

    // Press 'k' to navigate previous
    fireEvent.keyDown(document, { key: "k", code: "KeyK" });
  });

  it("does not handle keyboard navigation when typing in textarea", async () => {
    render(<DiffViewer oldValue={oldText} newValue={newText} />);

    const textarea = screen.getByPlaceholderText(
      /Enter revision summary/i
    ) as HTMLTextAreaElement;

    // Focus textarea and type 'j'
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "j", code: "KeyJ" });

    // Should not navigate (no highlight change)
    expect(textarea).toHaveFocus();
  });

  it("allows manual editing of revision summary", async () => {
    const user = userEvent.setup();
    const onSummaryChange = jest.fn();

    render(
      <DiffViewer
        oldValue={oldText}
        newValue={newText}
        onSummaryChange={onSummaryChange}
      />
    );

    const textarea = screen.getByPlaceholderText(
      /Enter revision summary/i
    ) as HTMLTextAreaElement;

    await user.type(textarea, "Custom summary");

    expect(textarea.value).toBe("Custom summary");
    expect(onSummaryChange).toHaveBeenCalledWith("Custom summary");
  });

  it("uses initial revision summary value", () => {
    const initialSummary = "Initial summary text";

    render(
      <DiffViewer
        oldValue={oldText}
        newValue={newText}
        revisionSummary={initialSummary}
      />
    );

    const textarea = screen.getByPlaceholderText(
      /Enter revision summary/i
    ) as HTMLTextAreaElement;

    expect(textarea.value).toBe(initialSummary);
  });

  it("shows change count indicator", () => {
    render(<DiffViewer oldValue={oldText} newValue={newText} />);

    expect(screen.getByText(/\d+ change/i)).toBeInTheDocument();
  });

  it("highlights selected block", async () => {
    render(<DiffViewer oldValue={oldText} newValue={newText} />);

    // Press 'j' to select first change
    fireEvent.keyDown(document, { key: "j", code: "KeyJ" });

    await waitFor(() => {
      const highlightLines = JSON.parse(
        screen.getByTestId("highlight-lines").textContent || "[]"
      );
      expect(highlightLines.length).toBeGreaterThan(0);
    });
  });

  it("handles large diffs with performance optimizations", () => {
    const largeOldText = Array.from({ length: 1000 }, (_, i) => `Line ${i}`).join("\n");
    const largeNewText = Array.from({ length: 1000 }, (_, i) => `Line ${i} modified`).join("\n");

    render(<DiffViewer oldValue={largeOldText} newValue={largeNewText} />);

    expect(screen.getByTestId("diff-viewer")).toBeInTheDocument();
  });

  it("handles empty diff", () => {
    const sameText = "Same text";

    render(<DiffViewer oldValue={sameText} newValue={sameText} />);

    expect(screen.getByText(/No changes/i)).toBeInTheDocument();
  });

  it("handles completely different texts", () => {
    render(
      <DiffViewer oldValue="Completely different old" newValue="Completely different new" />
    );

    expect(screen.getByTestId("diff-viewer")).toBeInTheDocument();
    expect(screen.getByText(/Added:/i)).toBeInTheDocument();
    expect(screen.getByText(/Removed:/i)).toBeInTheDocument();
  });

  it("hides copy button when showCopyButton is false", () => {
    render(<DiffViewer oldValue={oldText} newValue={newText} showCopyButton={false} />);

    expect(screen.queryByTitle(/Copy summary/i)).not.toBeInTheDocument();
  });
});

