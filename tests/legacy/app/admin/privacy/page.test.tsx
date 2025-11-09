import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, waitFor } from "@testing-library/react"
import PrivacyManagementPage from "../page"

// Mock useAuth
jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: {
      id: "admin1",
      username: "admin",
      role: "admin",
    },
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe("PrivacyManagementPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders privacy management page", async () => {
    const mockRequests = {
      requests: [
        {
          id: "1",
          userId: "user1",
          type: "data_export",
          status: "pending",
          requestedAt: new Date().toISOString(),
          slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          slaWarningThreshold: 60,
          priority: "normal",
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    }

    const mockMetrics = {
      metrics: {
        totalRequests: 1,
        pendingRequests: 1,
        inProgressRequests: 0,
        completedRequests: 0,
        overdueRequests: 0,
        averageCompletionTime: 0,
        slaComplianceRate: 100,
        requestsByType: {
          data_export: 1,
          data_deletion: 0,
          content_takedown: 0,
        },
        requestsByPriority: {
          low: 0,
          normal: 1,
          high: 0,
          urgent: 0,
        },
      },
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequests,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      })

    render(<PrivacyManagementPage />)

    await waitFor(() => {
      expect(screen.getByText("Privacy Management")).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText("Total Requests")).toBeInTheDocument()
    })
  })

  it("displays loading state initially", () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<PrivacyManagementPage />)

    expect(screen.getByText("Privacy Management")).toBeInTheDocument()
  })

  it("handles API errors gracefully", async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

    render(<PrivacyManagementPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})

