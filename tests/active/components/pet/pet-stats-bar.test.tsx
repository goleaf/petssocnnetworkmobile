import { render, screen, fireEvent } from "@testing-library/react"
import { PetStatsBar } from "@/components/pet/pet-stats-bar"

describe("PetStatsBar", () => {
  const defaultProps = {
    followers: 245,
    photos: 89,
    posts: 34,
    age: "3 years old",
  }

  it("renders all stats correctly", () => {
    render(<PetStatsBar {...defaultProps} />)

    expect(screen.getByText("245")).toBeInTheDocument()
    expect(screen.getByText("Followers")).toBeInTheDocument()

    expect(screen.getByText("89")).toBeInTheDocument()
    expect(screen.getByText("Photos")).toBeInTheDocument()

    expect(screen.getByText("34")).toBeInTheDocument()
    expect(screen.getByText("Posts")).toBeInTheDocument()

    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("Age")).toBeInTheDocument()
  })

  it("displays singular labels for count of 1", () => {
    render(<PetStatsBar {...defaultProps} followers={1} photos={1} posts={1} />)

    expect(screen.getByText("Follower")).toBeInTheDocument()
    expect(screen.getByText("Photo")).toBeInTheDocument()
    expect(screen.getByText("Post")).toBeInTheDocument()
  })

  it("calls onClick handlers when stats are clicked", () => {
    const onFollowersClick = jest.fn()
    const onPhotosClick = jest.fn()
    const onPostsClick = jest.fn()
    const onAgeClick = jest.fn()

    render(
      <PetStatsBar
        {...defaultProps}
        onFollowersClick={onFollowersClick}
        onPhotosClick={onPhotosClick}
        onPostsClick={onPostsClick}
        onAgeClick={onAgeClick}
      />
    )

    const followersButton = screen.getByLabelText("View followers")
    const photosButton = screen.getByLabelText("View photos")
    const postsButton = screen.getByLabelText("View posts")
    const ageButton = screen.getByLabelText("View age")

    fireEvent.click(followersButton)
    expect(onFollowersClick).toHaveBeenCalledTimes(1)

    fireEvent.click(photosButton)
    expect(onPhotosClick).toHaveBeenCalledTimes(1)

    fireEvent.click(postsButton)
    expect(onPostsClick).toHaveBeenCalledTimes(1)

    fireEvent.click(ageButton)
    expect(onAgeClick).toHaveBeenCalledTimes(1)
  })

  it("supports keyboard navigation with Enter key", () => {
    const onFollowersClick = jest.fn()

    render(
      <PetStatsBar {...defaultProps} onFollowersClick={onFollowersClick} />
    )

    const followersButton = screen.getByLabelText("View followers")
    fireEvent.keyDown(followersButton, { key: "Enter" })

    expect(onFollowersClick).toHaveBeenCalledTimes(1)
  })

  it("supports keyboard navigation with Space key", () => {
    const onPhotosClick = jest.fn()

    render(<PetStatsBar {...defaultProps} onPhotosClick={onPhotosClick} />)

    const photosButton = screen.getByLabelText("View photos")
    fireEvent.keyDown(photosButton, { key: " " })

    expect(onPhotosClick).toHaveBeenCalledTimes(1)
  })

  it("does not make stats clickable when no onClick handler is provided", () => {
    render(<PetStatsBar {...defaultProps} />)

    const stats = screen.getAllByRole("generic")
    stats.forEach((stat) => {
      expect(stat).not.toHaveAttribute("role", "button")
      expect(stat).not.toHaveAttribute("tabIndex")
    })
  })

  it("applies custom className", () => {
    const { container } = render(
      <PetStatsBar {...defaultProps} className="custom-class" />
    )

    const card = container.querySelector(".custom-class")
    expect(card).toBeInTheDocument()
  })

  it("handles age with unknown value", () => {
    render(<PetStatsBar {...defaultProps} age="Age unknown" />)

    expect(screen.getByText("Age")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("extracts numeric age value correctly", () => {
    render(<PetStatsBar {...defaultProps} age="5 years, 3 months old" />)

    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("has responsive grid layout classes", () => {
    const { container } = render(<PetStatsBar {...defaultProps} />)

    const grid = container.querySelector(".grid")
    expect(grid).toHaveClass("grid-cols-2")
    expect(grid).toHaveClass("sm:grid-cols-4")
  })
})
