import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WatchButton } from "../watch-button"
import { useAuth } from "@/lib/auth"

jest.mock("@/lib/auth")

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch
global.fetch = jest.fn()

describe("WatchButton", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear()
    mockUseAuth.mockReturnValue({
      user: {
        id: "user1",
        email: "test@example.com",
        username: "testuser",
        fullName: "Test User",
        joinedAt: new Date().toISOString(),
        followers: [],
        following: [],
      },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })
  })

  it("renders Watch button when not watching", () => {
    render(<WatchButton targetId="post1" targetType="post" initialWatching={false} />)
    
    expect(screen.getByText("Watch")).toBeInTheDocument()
  })

  it("renders Watching button when watching", () => {
    render(<WatchButton targetId="post1" targetType="post" initialWatching={true} />)
    
    expect(screen.getByText("Watching")).toBeInTheDocument()
  })

  it("toggles watch state on click", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ watching: true, success: true }),
    })

    render(<WatchButton targetId="post1" targetType="post" initialWatching={false} />)
    
    const button = screen.getByText("Watch")
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText("Watching")).toBeInTheDocument()
    })
  })

  it("calls API with correct parameters", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ watching: true, success: true }),
    })

    render(<WatchButton targetId="wiki1" targetType="wiki" initialWatching={false} />)
    
    const button = screen.getByText("Watch")
    await user.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/watch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user1",
          targetId: "wiki1",
          targetType: "wiki",
          watchEvents: ["update", "comment", "reaction"],
        }),
      })
    })
  })

  it("does not render when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    const { container } = render(<WatchButton targetId="post1" targetType="post" />)
    
    expect(container.firstChild).toBeNull()
  })
})

