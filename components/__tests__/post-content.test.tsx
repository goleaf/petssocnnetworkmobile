import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { PostContent } from "@/components/post/post-content"

const makePost = (overrides: Partial<any> = {}) => ({
  id: "p1",
  petId: "pet1",
  authorId: "u1",
  title: "Test Post",
  content: "",
  tags: [],
  categories: [],
  likes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "published",
  promotedBy: "u1",
  promotedAt: new Date().toISOString(),
  ...overrides,
})

describe("PostContent", () => {
  it("linkifies URLs, mentions, and hashtags", () => {
    const content = "Check https://example.com @alice #pets";
    render(<PostContent content={content} post={makePost({ content })} />)

    const url = screen.getByText("https://example.com") as HTMLAnchorElement
    expect(url).toBeInTheDocument()
    expect(url.tagName).toBe("A")
    expect(url.href).toContain("https://example.com")

    const mention = screen.getByText("@alice") as HTMLAnchorElement
    expect(mention).toBeInTheDocument()
    expect(mention.href).toContain("/profile/alice")

    const hashtag = screen.getByText("#pets") as HTMLAnchorElement
    expect(hashtag).toBeInTheDocument()
    expect(hashtag.href).toContain("/search?q=%23pets")
  })

  it("shows Read more for long content and expands on click", () => {
    const long = "x".repeat(500)
    render(<PostContent content={long} post={makePost({ content: long })} />)

    const btn = screen.getByText(/read more/i)
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    // After expanding, the Read more button disappears
    expect(screen.queryByText(/read more/i)).toBeNull()
  })
})

