import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import AdminOrgsPage from "@/app/admin/orgs/page"
import { getOrganizations, updateOrganization } from "@/lib/storage"
import type { Organization } from "@/lib/types"

// Mock the storage functions
vi.mock("@/lib/storage", () => ({
  getOrganizations: vi.fn(),
  updateOrganization: vi.fn(),
  getOrganizationById: vi.fn(),
}))

const mockOrganizations: Organization[] = [
  {
    id: "org1",
    name: "Happy Paws Shelter",
    type: "shelter",
    verifiedAt: new Date().toISOString(),
    website: "https://happypaws.com",
    representatives: [
      {
        userId: "user1",
        role: "admin",
        assignedAt: new Date().toISOString(),
        assignedBy: "admin",
      },
    ],
    coiDisclosure: {
      required: true,
      disclosed: false,
    },
  },
  {
    id: "org2",
    name: "PetBrand Co",
    type: "brand",
    website: "https://petbrand.com",
    representatives: [],
    coiDisclosure: {
      required: false,
      disclosed: false,
    },
  },
]

describe("AdminOrgsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getOrganizations as ReturnType<typeof vi.fn>).mockReturnValue(mockOrganizations)
  })

  it("renders organizations list", () => {
    render(<AdminOrgsPage />)

    expect(screen.getByText("Organizations Management")).toBeInTheDocument()
    expect(screen.getByText("Happy Paws Shelter")).toBeInTheDocument()
    expect(screen.getByText("PetBrand Co")).toBeInTheDocument()
  })

  it("displays verification status correctly", () => {
    render(<AdminOrgsPage />)

    expect(screen.getByText("Verified")).toBeInTheDocument()
    expect(screen.getByText("Unverified")).toBeInTheDocument()
  })

  it("displays representative count", () => {
    render(<AdminOrgsPage />)

    expect(screen.getByText("1 representative")).toBeInTheDocument()
    expect(screen.getByText("0 representatives")).toBeInTheDocument()
  })

  it("displays COI disclosure status", () => {
    render(<AdminOrgsPage />)

    expect(screen.getByText("Required")).toBeInTheDocument()
    expect(screen.getByText("Not Required")).toBeInTheDocument()
  })

  it("filters organizations by search query", async () => {
    render(<AdminOrgsPage />)

    const searchInput = screen.getByPlaceholderText("Search organizations...")
    fireEvent.change(searchInput, { target: { value: "Happy" } })

    await waitFor(() => {
      expect(screen.getByText("Happy Paws Shelter")).toBeInTheDocument()
      expect(screen.queryByText("PetBrand Co")).not.toBeInTheDocument()
    })
  })

  it("toggles verification status", async () => {
    render(<AdminOrgsPage />)

    const verifyButtons = screen.getAllByText("Verify")
    const unverifiedButton = verifyButtons.find(
      (btn) => btn.textContent === "Verify"
    )

    if (unverifiedButton) {
      fireEvent.click(unverifiedButton)

      await waitFor(() => {
        expect(updateOrganization).toHaveBeenCalled()
      })
    }
  })

  it("toggles COI disclosure requirement", async () => {
    render(<AdminOrgsPage />)

    const switches = screen.getAllByRole("switch")
    const coiSwitch = switches[0] // First switch should be for org1

    fireEvent.click(coiSwitch)

    await waitFor(() => {
      expect(updateOrganization).toHaveBeenCalledWith(
        "org1",
        expect.objectContaining({
          coiDisclosure: expect.objectContaining({
            required: false,
          }),
        })
      )
    })
  })

  it("opens assign role dialog", async () => {
    render(<AdminOrgsPage />)

    const manageButtons = screen.getAllByText("Manage Roles")
    fireEvent.click(manageButtons[0])

    await waitFor(() => {
      expect(screen.getByText("Manage Representatives")).toBeInTheDocument()
    })
  })

  it("displays current representatives in dialog", async () => {
    render(<AdminOrgsPage />)

    const manageButtons = screen.getAllByText("Manage Roles")
    fireEvent.click(manageButtons[0])

    await waitFor(() => {
      expect(screen.getByText("User ID: user1")).toBeInTheDocument()
      expect(screen.getByText("Role:")).toBeInTheDocument()
    })
  })

  it("assigns new representative role", async () => {
    render(<AdminOrgsPage />)

    const manageButtons = screen.getAllByText("Manage Roles")
    fireEvent.click(manageButtons[0])

    await waitFor(() => {
      expect(screen.getByText("Manage Representatives")).toBeInTheDocument()
    })

    const userIdInput = screen.getByPlaceholderText("Enter user ID")
    fireEvent.change(userIdInput, { target: { value: "user2" } })

    const assignButton = screen.getByText("Assign Role")
    fireEvent.click(assignButton)

    await waitFor(() => {
      expect(updateOrganization).toHaveBeenCalled()
    })
  })
})

