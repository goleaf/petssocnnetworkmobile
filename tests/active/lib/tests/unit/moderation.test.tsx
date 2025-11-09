import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ModerationPage from "@/app/admin/moderation/page"
import { useAuth } from "@/lib/auth"
import * as moderationUtils from "@/lib/moderation"
import * as storageUtils from "@/lib/storage"

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  __esModule: true,
  useAuth: jest.fn(),
}))
jest.mock("@/lib/moderation")
jest.mock("@/lib/storage")

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockGetModerationStats = moderationUtils.getModerationStats as jest.MockedFunction<typeof moderationUtils.getModerationStats>
const mockGetPaginatedEditRequests = moderationUtils.getPaginatedEditRequests as jest.MockedFunction<typeof moderationUtils.getPaginatedEditRequests>
const mockFilterEditRequests = moderationUtils.filterEditRequests as jest.MockedFunction<typeof moderationUtils.filterEditRequests>
const mockApproveEditRequest = moderationUtils.approveEditRequest as jest.MockedFunction<typeof moderationUtils.approveEditRequest>
const mockRejectEditRequest = moderationUtils.rejectEditRequest as jest.MockedFunction<typeof moderationUtils.rejectEditRequest>
const mockGetEditRequestAuditTrail = moderationUtils.getEditRequestAuditTrail as jest.MockedFunction<typeof moderationUtils.getEditRequestAuditTrail>
const mockGetUserById = storageUtils.getUserById as jest.MockedFunction<typeof storageUtils.getUserById>
const mockGetBlogPostById = storageUtils.getBlogPostById as jest.MockedFunction<typeof storageUtils.getBlogPostById>

describe("Moderation Dashboard", () => {
  const mockUser = {
    id: "moderator1",
    username: "moderator",
    email: "mod@test.com",
    role: "admin" as const,
  }

  const mockEditRequest = {
    id: "req1",
    type: "blog" as const,
    contentId: "post1",
    authorId: "user1",
    status: "pending" as const,
    originalData: { title: "Old Title" },
    editedData: { title: "New Title" },
    changesSummary: "Changed title",
    createdAt: new Date().toISOString(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      switchUser: jest.fn(),
      initialize: jest.fn(),
      hasRole: jest.fn(() => true),
      isAdmin: jest.fn(() => true),
      isModerator: jest.fn(() => true),
    } as any)

    mockGetModerationStats.mockReturnValue({
      totalPending: 5,
      totalApproved: 10,
      totalRejected: 3,
      pendingByType: { blog: 3, wiki: 2 },
      avgProcessingTime: 2.5,
      oldestPending: mockEditRequest,
    })

    mockGetPaginatedEditRequests.mockReturnValue({
      items: [mockEditRequest],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })

    mockFilterEditRequests.mockReturnValue([mockEditRequest])
    mockGetUserById.mockReturnValue({ id: "user1", username: "testuser" } as any)
    mockGetBlogPostById.mockReturnValue({ id: "post1", title: "Test Post" } as any)
    mockGetEditRequestAuditTrail.mockReturnValue([
      {
        id: "audit1",
        editRequestId: "req1",
        action: "created",
        performedBy: "user1",
        performedAt: new Date().toISOString(),
      },
    ])
  })

  it("should render moderation dashboard", () => {
    render(<ModerationPage />)
    expect(screen.getByText("Content Moderation")).toBeInTheDocument()
  })

  it("should display statistics", () => {
    render(<ModerationPage />)
    expect(screen.getByText("5")).toBeInTheDocument() // totalPending
    expect(screen.getByText("10")).toBeInTheDocument() // totalApproved
    expect(screen.getByText("3")).toBeInTheDocument() // totalRejected
  })

  it("should filter by type", async () => {
    render(<ModerationPage />)
    
    const typeSelect = screen.getByLabelText(/content type/i)
    fireEvent.click(typeSelect)
    
    const blogOption = screen.getByText("Blog Posts")
    fireEvent.click(blogOption)

    await waitFor(() => {
      expect(mockGetPaginatedEditRequests).toHaveBeenCalledWith(
        expect.objectContaining({ type: "blog" }),
        expect.any(Object)
      )
    })
  })

  it("should filter by status", async () => {
    render(<ModerationPage />)
    
    const statusSelect = screen.getByLabelText(/status/i)
    fireEvent.click(statusSelect)
    
    const pendingOption = screen.getByText("Pending")
    fireEvent.click(pendingOption)

    await waitFor(() => {
      expect(mockGetPaginatedEditRequests).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" }),
        expect.any(Object)
      )
    })
  })

  it("should filter by reporter ID", async () => {
    render(<ModerationPage />)
    
    const reporterInput = screen.getByPlaceholderText(/filter by reporter/i)
    fireEvent.change(reporterInput, { target: { value: "reporter1" } })

    await waitFor(() => {
      expect(mockGetPaginatedEditRequests).toHaveBeenCalledWith(
        expect.objectContaining({ reporterId: "reporter1" }),
        expect.any(Object)
      )
    })
  })

  it("should filter by max age", async () => {
    render(<ModerationPage />)
    
    const ageInput = screen.getByPlaceholderText(/no limit/i)
    fireEvent.change(ageInput, { target: { value: "24" } })

    await waitFor(() => {
      expect(mockGetPaginatedEditRequests).toHaveBeenCalledWith(
        expect.objectContaining({ maxAge: 24 }),
        expect.any(Object)
      )
    })
  })

  it("should handle pagination", async () => {
    mockGetPaginatedEditRequests.mockReturnValue({
      items: [mockEditRequest],
      total: 25,
      page: 1,
      pageSize: 10,
      totalPages: 3,
    })

    render(<ModerationPage />)
    
    const nextButton = screen.getByText(/next/i)
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockGetPaginatedEditRequests).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ page: 2 })
      )
    })
  })

  it("should approve edit request", async () => {
    mockApproveEditRequest.mockReturnValue({ success: true })
    
    render(<ModerationPage />)
    
    const approveButton = screen.getByText(/approve/i)
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(mockApproveEditRequest).toHaveBeenCalledWith("req1", "moderator1")
    })
  })

  it("should reject edit request with reason", async () => {
    mockRejectEditRequest.mockReturnValue({ success: true })
    
    render(<ModerationPage />)
    
    const rejectButton = screen.getByText(/reject/i)
    fireEvent.click(rejectButton)

    const reasonDialog = screen.getByText(/reject edit request/i)
    expect(reasonDialog).toBeInTheDocument()

    const reasonInput = screen.getByPlaceholderText(/enter rejection reason/i)
    fireEvent.change(reasonInput, { target: { value: "Inappropriate content" } })

    const confirmButton = screen.getByText(/reject/i).closest("button")
    if (confirmButton) {
      fireEvent.click(confirmButton)
    }

    await waitFor(() => {
      expect(mockRejectEditRequest).toHaveBeenCalledWith(
        "req1",
        "moderator1",
        "Inappropriate content"
      )
    })
  })

  it("should display audit trail", async () => {
    render(<ModerationPage />)
    
    const historyButton = screen.getByText(/history/i)
    fireEvent.click(historyButton)

    await waitFor(() => {
      expect(mockGetEditRequestAuditTrail).toHaveBeenCalledWith("req1")
      expect(screen.getByText(/audit trail/i)).toBeInTheDocument()
    })
  })

  it("should show consistent pagination info", () => {
    mockGetPaginatedEditRequests.mockReturnValue({
      items: Array(10).fill(mockEditRequest),
      total: 25,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    })

    render(<ModerationPage />)
    
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument()
  })

  it("should disable pagination buttons appropriately", () => {
    mockGetPaginatedEditRequests.mockReturnValue({
      items: [mockEditRequest],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })

    render(<ModerationPage />)
    
    const prevButton = screen.getByText(/previous/i).closest("button")
    const nextButton = screen.getByText(/next/i).closest("button")
    
    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })
})
