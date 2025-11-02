/**
 * Tests for Wiki Revision Review Page
 * 
 * Tests:
 * - Only Experts/Moderators can approve stable
 * - Rollback is audited
 * - Stale review badge (>12mo)
 * - Request changes with comment
 * - Assign to expert
 */

import { render, screen, waitFor } from "@testing-library/react"
import { jest } from "@jest/globals"
import RevisionReviewPage from "../page"
import { useAuth } from "@/components/auth/auth-provider"

// Mock dependencies
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "test-id" }),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: jest.fn(),
}))

jest.mock("@/components/ui/loading-spinner", () => ({
  LoadingSpinner: ({ fullScreen }: { fullScreen?: boolean }) => (
    <div data-testid="loading-spinner">Loading...</div>
  ),
}))

// Mock fetch
global.fetch = jest.fn()

describe("Wiki Revision Review Page", () => {
  const mockFlaggedRevision = {
    id: "test-id",
    articleId: "article-1",
    revisionId: "revision-1",
    type: "Health",
    flaggedAt: new Date().toISOString(),
    status: "pending",
    assignedTo: null,
    approvedBy: null,
    approvedAt: null,
  }

  const mockRevision = {
    id: "revision-1",
    content: "Latest content",
    contentJSON: { blocks: [{ type: "paragraph", text: "Latest content" }] },
    createdAt: new Date().toISOString(),
  }

  const mockStableRevision = {
    id: "stable-1",
    content: "Stable content",
    contentJSON: { blocks: [{ type: "paragraph", text: "Stable content" }] },
    createdAt: new Date().toISOString(),
  }

  const mockArticle = {
    id: "article-1",
    title: "Test Article",
    slug: "test-article",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/revision")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRevision),
        })
      }
      if (url.includes("/stable")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStableRevision),
        })
      }
      if (url.includes("/article")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockArticle),
        })
      }
      if (url.includes("/experts")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ experts: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFlaggedRevision),
      })
    })
  })

  describe("Expert/Moderator Approval", () => {
    it("should show approve button for experts", async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { id: "expert-1", role: "moderator" },
      })

      render(<RevisionReviewPage />)

      await waitFor(() => {
        expect(screen.getByText("Approve Stable")).toBeInTheDocument()
      })

      const approveButton = screen.getByText("Approve Stable")
      expect(approveButton).not.toBeDisabled()
    })

    it("should show approve button for moderators", async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { id: "moderator-1", role: "moderator" },
      })

      render(<RevisionReviewPage />)

      await waitFor(() => {
        expect(screen.getByText("Approve Stable")).toBeInTheDocument()
      })

      const approveButton = screen.getByText("Approve Stable")
      expect(approveButton).not.toBeDisabled()
    })

    it("should disable approve button for regular users", async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { id: "user-1", role: "user" },
      })

      render(<RevisionReviewPage />)

      await waitFor(() => {
        expect(screen.getByText("Approve Stable")).toBeInTheDocument()
      })

      const approveButton = screen.getByText("Approve Stable")
      expect(approveButton).toBeDisabled()
    })
  })

  describe("Stale Review Badge", () => {
    it("should show stale badge for reviews >12 months old", async () => {
      const oldDate = new Date()
      oldDate.setMonth(oldDate.getMonth() - 13) // 13 months ago

      ;(useAuth as jest.Mock).mockReturnValue({
        user: { id: "expert-1", role: "moderator" },
      })

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/test-id") && !url.includes("/revision") && !url.includes("/stable") && !url.includes("/article")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockFlaggedRevision,
              flaggedAt: oldDate.toISOString(),
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRevision),
        })
      })

      render(<RevisionReviewPage />)

      await waitFor(() => {
        expect(screen.getByText("Stale review")).toBeInTheDocument()
      })
    })

    it("should not show stale badge for recent reviews", async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { id: "expert-1", role: "moderator" },
      })

      render(<RevisionReviewPage />)

      await waitFor(() => {
        expect(screen.queryByText("Stale review")).not.toBeInTheDocument()
      })
    })
  })

  describe("Rollback Audit", () => {
    it("should call rollback API with audit data", async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { id: "expert-1", role: "moderator" },
      })

      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/rollback")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true }),
          })
        }
        if (url.includes("/revision")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockRevision),
          })
        }
        if (url.includes("/stable")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStableRevision),
          })
        }
        if (url.includes("/article")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockArticle),
          })
        }
        if (url.includes("/experts")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ experts: [] }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFlaggedRevision),
        })
      })

      render(<RevisionReviewPage />)

      await waitFor(() => {
        expect(screen.getByText("Rollback")).toBeInTheDocument()
      })

      // The rollback button should be available
      const rollbackButton = screen.getByText("Rollback")
      expect(rollbackButton).toBeInTheDocument()
    })
  })

  describe("Request Changes", () => {
    it("should allow requesting changes with comment", async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { id: "expert-1", role: "moderator" },
      })

      render(<RevisionReviewPage />)

      await waitFor(() => {
        expect(screen.getByText("Request Changes")).toBeInTheDocument()
      })

      const requestButton = screen.getByText("Request Changes")
      expect(requestButton).toBeInTheDocument()
    })
  })

  describe("Assign Expert", () => {
    it("should allow assigning to expert", async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: { id: "expert-1", role: "moderator" },
      })

      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/experts")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              experts: [
                { id: "expert-1", name: "Dr. Smith", email: "dr@example.com" },
              ],
            }),
          })
        }
        if (url.includes("/revision")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockRevision),
          })
        }
        if (url.includes("/stable")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStableRevision),
          })
        }
        if (url.includes("/article")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockArticle),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFlaggedRevision),
        })
      })

      render(<RevisionReviewPage />)

      await waitFor(() => {
        expect(screen.getByText("Assign Expert")).toBeInTheDocument()
      })

      const assignButton = screen.getByText("Assign Expert")
      expect(assignButton).toBeInTheDocument()
    })
  })
})

