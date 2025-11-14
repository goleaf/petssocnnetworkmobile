import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecentChangesFeed } from "@/components/admin/RecentChangesFeed";
import type { PaginatedResult, EditRequest } from "@/lib/types/moderation";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockEditRequest: EditRequest = {
  id: "edit1",
  contentType: "blog",
  contentId: "blog1",
  userId: "user1",
  status: "pending",
  priority: "normal",
  changes: {
    oldValue: "Original content",
    newValue: "Updated content",
  },
  reason: "Fixing typos",
  metadata: {
    isCOI: false,
    isFlaggedHealth: false,
    isNewPage: false,
    hasImages: false,
  },
  createdAt: new Date("2025-01-01T10:00:00Z"),
  updatedAt: new Date("2025-01-01T10:00:00Z"),
  reviewedAt: null,
  reviewedBy: null,
};

const mockPaginatedResult: PaginatedResult<EditRequest> = {
  items: [mockEditRequest],
  page: 1,
  limit: 10,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe("RecentChangesFeed", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("renders loading spinner initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<RecentChangesFeed />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("fetches and displays edit requests", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResult,
    });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText("Blog Edit")).toBeInTheDocument();
    });

    expect(screen.getByText("normal")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("Content ID: blog1")).toBeInTheDocument();
    expect(screen.getByText("User: user1")).toBeInTheDocument();
    expect(screen.getByText(/Reason:/)).toBeInTheDocument();
    expect(screen.getByText("Fixing typos")).toBeInTheDocument();
  });

  it("displays error message on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch edit requests/)).toBeInTheDocument();
    });
  });

  it("displays empty state when no items", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockPaginatedResult,
        items: [],
        totalCount: 0,
      }),
    });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText(/No edit requests found/)).toBeInTheDocument();
    });
  });

  it("applies filters to API request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResult,
    });

    const filters = {
      contentType: ["blog", "wiki"],
      status: ["pending"],
      priority: ["high"],
      ageInDays: 7,
    };

    render(<RecentChangesFeed filters={filters} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain("contentType=blog%2Cwiki");
    expect(callUrl).toContain("status=pending");
    expect(callUrl).toContain("priority=high");
    expect(callUrl).toContain("ageInDays=7");
  });

  it("toggles diff viewer on button click", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResult,
    });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText("Show Changes")).toBeInTheDocument();
    });

    const toggleButton = screen.getByText("Show Changes");
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText("Hide Changes")).toBeInTheDocument();
    });

    // Diff viewer should be visible
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByText("Proposed")).toBeInTheDocument();
  });

  it("calls onApprove when approve button clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResult,
    });

    const onApprove = jest.fn().mockResolvedValue(undefined);
    render(<RecentChangesFeed onApprove={onApprove} />);

    await waitFor(() => {
      expect(screen.getByText("Approve")).toBeInTheDocument();
    });

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith("edit1");
    });
  });

  it("calls onReject when reject button clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResult,
    });

    const onReject = jest.fn().mockResolvedValue(undefined);
    render(<RecentChangesFeed onReject={onReject} />);

    await waitFor(() => {
      expect(screen.getByText("Reject")).toBeInTheDocument();
    });

    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(onReject).toHaveBeenCalledWith("edit1");
    });
  });

  it("disables action buttons during loading", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResult,
    });

    const onApprove = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<RecentChangesFeed onApprove={onApprove} />);

    await waitFor(() => {
      expect(screen.getByText("Approve")).toBeInTheDocument();
    });

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(approveButton).toBeDisabled();
    });
  });

  it("displays metadata badges correctly", async () => {
    const editWithMetadata: EditRequest = {
      ...mockEditRequest,
      metadata: {
        isCOI: true,
        isFlaggedHealth: true,
        isNewPage: true,
        hasImages: true,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockPaginatedResult,
        items: [editWithMetadata],
      }),
    });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText("COI")).toBeInTheDocument();
      expect(screen.getByText("Health")).toBeInTheDocument();
      expect(screen.getByText("New Page")).toBeInTheDocument();
      expect(screen.getByText("Images")).toBeInTheDocument();
    });
  });

  it("handles pagination correctly", async () => {
    const multiPageResult: PaginatedResult<EditRequest> = {
      ...mockPaginatedResult,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => multiPageResult,
    });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 3 (1 total items)")).toBeInTheDocument();
    });

    const nextButton = screen.getByText("Next");
    expect(nextButton).not.toBeDisabled();

    const prevButton = screen.getByText("Previous");
    expect(prevButton).toBeDisabled();
  });

  it("navigates to next page on button click", async () => {
    const multiPageResult: PaginatedResult<EditRequest> = {
      ...mockPaginatedResult,
      totalPages: 3,
      hasNextPage: true,
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => multiPageResult,
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          ...multiPageResult,
          page: 2,
          hasPreviousPage: true,
        }),
      });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Page 2 of 3 (1 total items)")).toBeInTheDocument();
    });

    // Verify page=2 was requested
    const calls = mockFetch.mock.calls;
    const page2Call = calls.find((call) => call[0].includes("page=2"));
    expect(page2Call).toBeDefined();
  });

  it("hides action buttons for non-pending requests", async () => {
    const approvedEdit: EditRequest = {
      ...mockEditRequest,
      status: "approved",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockPaginatedResult,
        items: [approvedEdit],
      }),
    });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText("approved")).toBeInTheDocument();
    });

    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    expect(screen.queryByText("Reject")).not.toBeInTheDocument();
  });

  it("formats content type correctly", async () => {
    const wikiEdit: EditRequest = {
      ...mockEditRequest,
      contentType: "wiki",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockPaginatedResult,
        items: [wikiEdit],
      }),
    });

    render(<RecentChangesFeed />);

    await waitFor(() => {
      expect(screen.getByText("Wiki Edit")).toBeInTheDocument();
    });
  });

  it("applies custom className", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResult,
    });

    const { container } = render(<RecentChangesFeed className="custom-class" />);

    await waitFor(() => {
      expect(screen.getByText("Blog Edit")).toBeInTheDocument();
    });

    const feedContainer = container.querySelector(".custom-class");
    expect(feedContainer).toBeInTheDocument();
  });

  it("respects custom pageSize prop", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResult,
    });

    render(<RecentChangesFeed pageSize={25} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain("limit=25");
  });
});
