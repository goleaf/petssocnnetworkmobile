import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WikiQualityDashboard from "../page";
import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => "/wiki/quality",
}));

// Mock fetch
global.fetch = jest.fn();

describe("WikiQualityDashboard", () => {
  const mockQualityData = {
    citations: [
      {
        id: "citation-1",
        slug: "test-article",
        title: "Test Article",
        type: "care",
        updatedAt: new Date().toISOString(),
        lastRevisionRev: 1,
      },
    ],
    reviews: [
      {
        id: "review-1",
        slug: "stale-article",
        title: "Stale Article",
        type: "health",
        updatedAt: new Date().toISOString(),
        lastReviewedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
        lastRevisionRev: 2,
      },
    ],
    links: [
      {
        id: "link-1",
        sourceId: "source-1",
        title: "Example Source",
        url: "https://example.com/source",
        isValid: false,
        brokenAt: new Date().toISOString(),
        lastChecked: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        article: {
          id: "article-1",
          slug: "article-with-broken-link",
          title: "Article with Broken Link",
          type: "care",
        },
      },
    ],
    orphaned: [],
  };

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("should render loading state initially", () => {
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    render(<WikiQualityDashboard />);
    
    // Check for the loading spinner icon
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it("should display quality dashboard with tabs", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQualityData,
    });

    render(<WikiQualityDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Wiki Quality Dashboard")).toBeInTheDocument();
    });

    expect(screen.getByText("Citations (1)")).toBeInTheDocument();
    expect(screen.getByText("Stale Reviews (1)")).toBeInTheDocument();
    expect(screen.getByText("Broken Links (1)")).toBeInTheDocument();
    expect(screen.getByText("Orphaned (0)")).toBeInTheDocument();
  });

  it("should display pages needing citations", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQualityData,
    });

    render(<WikiQualityDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Pages Needing Citations")).toBeInTheDocument();
    });

    expect(screen.getByText("Test Article")).toBeInTheDocument();
    expect(screen.getByText("care")).toBeInTheDocument();
  });

  it("should display stale reviews", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQualityData,
    });

    render(<WikiQualityDashboard />);

    // Click on reviews tab
    const reviewsTab = await screen.findByText("Stale Reviews (1)");
    await userEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getByText("Stale Article")).toBeInTheDocument();
    });
  });

  it("should display broken links with last check timestamp", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQualityData,
    });

    render(<WikiQualityDashboard />);

    // Click on links tab
    const linksTab = await screen.findByText("Broken Links (1)");
    await userEvent.click(linksTab);

    await waitFor(() => {
      expect(screen.getByText("Article with Broken Link")).toBeInTheDocument();
      expect(screen.getByText(/Last checked:/i)).toBeInTheDocument();
      expect(screen.getByText(/Example Source/i)).toBeInTheDocument();
    });
  });

  it("should display retry button for broken links", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQualityData,
    });

    render(<WikiQualityDashboard />);

    // Click on links tab
    const linksTab = await screen.findByText("Broken Links (1)");
    await userEvent.click(linksTab);

    await waitFor(() => {
      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  it("should queue recheck when retry button is clicked", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQualityData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          source: {
            id: "link-1",
            isValid: true,
            brokenAt: null,
            lastChecked: new Date().toISOString(),
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQualityData,
      });

    render(<WikiQualityDashboard />);

    // Click on links tab
    const linksTab = await screen.findByText("Broken Links (1)");
    await userEvent.click(linksTab);

    await waitFor(() => {
      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    const retryButton = screen.getByRole("button", { name: /retry/i });
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/wiki/quality/recheck",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sourceId: "link-1" }),
        })
      );
    });
  });

  it("should show loading state on retry button when rechecking", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQualityData,
      })
      .mockImplementationOnce(() => 
        new Promise((resolve) => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              source: {
                id: "link-1",
                isValid: true,
                brokenAt: null,
                lastChecked: new Date().toISOString(),
              },
            }),
          }), 100)
        )
      );

    render(<WikiQualityDashboard />);

    // Click on links tab
    const linksTab = await screen.findByText("Broken Links (1)");
    await userEvent.click(linksTab);

    await waitFor(() => {
      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    const retryButton = screen.getByRole("button", { name: /retry/i });
    await userEvent.click(retryButton);

    // Button should be disabled while retrying
    await waitFor(() => {
      expect(retryButton).toBeDisabled();
    });
  });

  it("should handle assign reviewer action", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQualityData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Reviewer assigned successfully",
        }),
      });

    // Mock window.alert
    window.alert = jest.fn();

    render(<WikiQualityDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Test Article")).toBeInTheDocument();
    });

    const assignButton = screen.getByRole("button", { name: /assign reviewer/i });
    await userEvent.click(assignButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/wiki/quality/assign",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ articleId: "citation-1" }),
        })
      );
    });
  });

  it("should open editor when edit button is clicked", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQualityData,
    });

    // Mock window.open
    const mockOpen = jest.fn();
    window.open = mockOpen;

    render(<WikiQualityDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Test Article")).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit/i });
    await userEvent.click(editButton);

    expect(mockOpen).toHaveBeenCalledWith("/wiki/test-article/edit", "_blank");
  });

  it("should open editor with section anchor for broken links", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQualityData,
    });

    // Mock window.open
    const mockOpen = jest.fn();
    window.open = mockOpen;

    render(<WikiQualityDashboard />);

    // Click on links tab
    const linksTab = await screen.findByText("Broken Links (1)");
    await userEvent.click(linksTab);

    await waitFor(() => {
      expect(screen.getByText("Article with Broken Link")).toBeInTheDocument();
    });

    const editSectionButton = screen.getByRole("button", { name: /edit section/i });
    await userEvent.click(editSectionButton);

    expect(mockOpen).toHaveBeenCalledWith(
      "/wiki/article-with-broken-link/edit#source-source-1",
      "_blank"
    );
  });

  it("should display empty state when no items", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        citations: [],
        reviews: [],
        links: [],
        orphaned: [],
      }),
    });

    render(<WikiQualityDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No pages need citations")).toBeInTheDocument();
    });
  });

  it("should handle API error gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<WikiQualityDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load quality data/i)).toBeInTheDocument();
    });
  });
});

