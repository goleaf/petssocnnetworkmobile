import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PrivacyCircleSelector } from "@/components/privacy-circle-selector"
import * as privacyCircleModule from "@/lib/privacy-circle"

// Create a mock implementation
jest.mock("@/lib/privacy-circle", () => ({
  usePrivacyCircle: jest.fn(),
}))

describe("PrivacyCircleSelector", () => {
  const mockOnChange = jest.fn()
  const mockSetLastSelectedCircle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Set up default mock return value
    ;(privacyCircleModule.usePrivacyCircle as jest.Mock).mockReturnValue({
      lastSelectedCircle: "followers-only",
      setLastSelectedCircle: mockSetLastSelectedCircle,
    })
  })

  it("should render with default value from store", () => {
    render(<PrivacyCircleSelector value={undefined} onChange={mockOnChange} />)

    expect(screen.getByText("Followers Only")).toBeInTheDocument()
  })

  it("should render with provided value", () => {
    render(<PrivacyCircleSelector value="group-only" onChange={mockOnChange} />)

    expect(screen.getByText("Group Only")).toBeInTheDocument()
  })

  it("should call onChange when different option is selected", async () => {
    render(<PrivacyCircleSelector value="followers-only" onChange={mockOnChange} />)

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      const groupOption = screen.getByText("Group Only")
      expect(groupOption).toBeInTheDocument()
    })

    const groupOption = screen.getByText("Group Only")
    await userEvent.click(groupOption.closest("div")!)

    await waitFor(() => {
      expect(mockSetLastSelectedCircle).toHaveBeenCalledWith("group-only")
      expect(mockOnChange).toHaveBeenCalledWith("group-only")
    })
  })

  it("should open dropdown and show all privacy circle options", async () => {
    render(<PrivacyCircleSelector value="followers-only" onChange={mockOnChange} />)

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      const followersTexts = screen.getAllByText("Followers Only")
      const groupTexts = screen.getAllByText("Group Only")
      const closeFriendsTexts = screen.getAllByText("Close Friends")
      expect(followersTexts.length).toBeGreaterThan(0)
      expect(groupTexts.length).toBeGreaterThan(0)
      expect(closeFriendsTexts.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it("should display descriptions for each option", async () => {
    render(<PrivacyCircleSelector value="followers-only" onChange={mockOnChange} />)

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/only your followers can see this/i)).toBeInTheDocument()
      expect(screen.getByText(/only your group members can see this/i)).toBeInTheDocument()
      expect(screen.getByText(/only your close friends can see this/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it("should apply custom className", () => {
    const { container } = render(
      <PrivacyCircleSelector value="followers-only" onChange={mockOnChange} className="custom-class" />
    )

    const button = container.querySelector("button.custom-class")
    expect(button).toBeInTheDocument()
  })

  it("should update displayed value when value prop changes", () => {
    const { rerender } = render(
      <PrivacyCircleSelector value="followers-only" onChange={mockOnChange} />
    )

    expect(screen.getByText("Followers Only")).toBeInTheDocument()

    rerender(<PrivacyCircleSelector value="close-friends" onChange={mockOnChange} />)

    expect(screen.getByText("Close Friends")).toBeInTheDocument()
  })
})
