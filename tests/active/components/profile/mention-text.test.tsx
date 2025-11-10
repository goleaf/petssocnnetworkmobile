import React from "react"
import { render, screen } from "@testing-library/react"
import { MentionText } from "@/components/profile/mention-text"

describe("MentionText", () => {
  it("should render plain text without mentions", () => {
    render(<MentionText text="Hello world" />)
    expect(screen.getByText("Hello world")).toBeInTheDocument()
  })

  it("should render @mentions as clickable links", () => {
    render(<MentionText text="Hello @johndoe how are you?" />)
    
    const link = screen.getByRole("link", { name: "@johndoe" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/user/johndoe")
  })

  it("should render multiple mentions", () => {
    render(<MentionText text="Hey @johndoe and @janedoe!" />)
    
    const link1 = screen.getByRole("link", { name: "@johndoe" })
    const link2 = screen.getByRole("link", { name: "@janedoe" })
    
    expect(link1).toBeInTheDocument()
    expect(link2).toBeInTheDocument()
    expect(link1).toHaveAttribute("href", "/user/johndoe")
    expect(link2).toHaveAttribute("href", "/user/janedoe")
  })

  it("should handle mentions with underscores and hyphens", () => {
    render(<MentionText text="Hello @john_doe and @jane-smith" />)
    
    const link1 = screen.getByRole("link", { name: "@john_doe" })
    const link2 = screen.getByRole("link", { name: "@jane-smith" })
    
    expect(link1).toBeInTheDocument()
    expect(link2).toBeInTheDocument()
  })

  it("should apply blue color to mention links", () => {
    render(<MentionText text="Hello @johndoe" />)
    
    const link = screen.getByRole("link", { name: "@johndoe" })
    expect(link).toHaveClass("text-blue-600")
  })

  it("should handle empty text", () => {
    const { container } = render(<MentionText text="" />)
    expect(container.textContent).toBe("")
  })

  it("should preserve text before and after mentions", () => {
    const { container } = render(
      <MentionText text="Start @user1 middle @user2 end" />
    )
    
    expect(container.textContent).toContain("Start")
    expect(container.textContent).toContain("middle")
    expect(container.textContent).toContain("end")
  })

  it("should handle mention at the start of text", () => {
    render(<MentionText text="@johndoe is awesome" />)
    
    const link = screen.getByRole("link", { name: "@johndoe" })
    expect(link).toBeInTheDocument()
  })

  it("should handle mention at the end of text", () => {
    render(<MentionText text="Thanks @johndoe" />)
    
    const link = screen.getByRole("link", { name: "@johndoe" })
    expect(link).toBeInTheDocument()
  })
})
