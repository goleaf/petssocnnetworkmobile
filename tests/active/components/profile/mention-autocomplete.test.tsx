import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { MentionAutocomplete, type MentionUser } from "@/components/profile/mention-autocomplete"

describe("MentionAutocomplete", () => {
  const mockUsers: MentionUser[] = [
    {
      id: "1",
      username: "johndoe",
      fullName: "John Doe",
      avatar: "/avatar1.jpg",
    },
    {
      id: "2",
      username: "janedoe",
      fullName: "Jane Doe",
      avatar: "/avatar2.jpg",
    },
    {
      id: "3",
      username: "bobsmith",
      fullName: "Bob Smith",
      avatar: "/avatar3.jpg",
    },
  ]

  const mockSearchUsers = jest.fn(async (query: string) => {
    if (!query) return mockUsers
    return mockUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.fullName.toLowerCase().includes(query.toLowerCase())
    )
  })

  let textareaRef: React.RefObject<HTMLTextAreaElement>
  let value: string
  let onChange: jest.Mock

  beforeEach(() => {
    textareaRef = React.createRef<HTMLTextAreaElement>()
    value = ""
    onChange = jest.fn()
    mockSearchUsers.mockClear()
  })

  it("should not show dropdown initially", () => {
    const { container } = render(
      <>
        <textarea ref={textareaRef} value={value} onChange={() => {}} />
        <MentionAutocomplete
          textareaRef={textareaRef}
          value={value}
          onChange={onChange}
          onSearchUsers={mockSearchUsers}
        />
      </>
    )

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it("should trigger dropdown when @ is typed", async () => {
    value = "Hello @"
    const { rerender } = render(
      <>
        <textarea ref={textareaRef} value={value} onChange={() => {}} />
        <MentionAutocomplete
          textareaRef={textareaRef}
          value={value}
          onChange={onChange}
          onSearchUsers={mockSearchUsers}
        />
      </>
    )

    // Simulate input event
    if (textareaRef.current) {
      textareaRef.current.value = value
      textareaRef.current.selectionStart = value.length
      textareaRef.current.selectionEnd = value.length
      fireEvent.input(textareaRef.current)
    }

    await waitFor(() => {
      expect(mockSearchUsers).toHaveBeenCalled()
    })
  })

  it("should filter users based on query", async () => {
    value = "Hello @john"
    const { rerender } = render(
      <>
        <textarea ref={textareaRef} value={value} onChange={() => {}} />
        <MentionAutocomplete
          textareaRef={textareaRef}
          value={value}
          onChange={onChange}
          onSearchUsers={mockSearchUsers}
        />
      </>
    )

    // Simulate input event
    if (textareaRef.current) {
      textareaRef.current.value = value
      textareaRef.current.selectionStart = value.length
      textareaRef.current.selectionEnd = value.length
      fireEvent.input(textareaRef.current)
    }

    await waitFor(() => {
      expect(mockSearchUsers).toHaveBeenCalledWith("john")
    })
  })

  it("should display user list with profile photos and usernames", async () => {
    mockSearchUsers.mockResolvedValueOnce(mockUsers)
    
    value = "Hello @"
    render(
      <>
        <textarea ref={textareaRef} value={value} onChange={() => {}} />
        <MentionAutocomplete
          textareaRef={textareaRef}
          value={value}
          onChange={onChange}
          onSearchUsers={mockSearchUsers}
        />
      </>
    )

    // Simulate input event
    if (textareaRef.current) {
      textareaRef.current.value = value
      textareaRef.current.selectionStart = value.length
      textareaRef.current.selectionEnd = value.length
      fireEvent.input(textareaRef.current)
    }

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
      expect(screen.getByText("@johndoe")).toBeInTheDocument()
    })
  })

  it("should insert mention when user is selected", async () => {
    mockSearchUsers.mockResolvedValueOnce(mockUsers)
    
    value = "Hello @j"
    render(
      <>
        <textarea ref={textareaRef} value={value} onChange={() => {}} />
        <MentionAutocomplete
          textareaRef={textareaRef}
          value={value}
          onChange={onChange}
          onSearchUsers={mockSearchUsers}
        />
      </>
    )

    // Simulate input event
    if (textareaRef.current) {
      textareaRef.current.value = value
      textareaRef.current.selectionStart = value.length
      textareaRef.current.selectionEnd = value.length
      fireEvent.input(textareaRef.current)
    }

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    // Click on the first user
    fireEvent.click(screen.getByText("John Doe"))

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("Hello @johndoe ")
    })
  })

  it("should show 'No users found' when search returns empty", async () => {
    mockSearchUsers.mockResolvedValueOnce([])
    
    value = "Hello @xyz"
    render(
      <>
        <textarea ref={textareaRef} value={value} onChange={() => {}} />
        <MentionAutocomplete
          textareaRef={textareaRef}
          value={value}
          onChange={onChange}
          onSearchUsers={mockSearchUsers}
        />
      </>
    )

    // Simulate input event
    if (textareaRef.current) {
      textareaRef.current.value = value
      textareaRef.current.selectionStart = value.length
      textareaRef.current.selectionEnd = value.length
      fireEvent.input(textareaRef.current)
    }

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument()
    })
  })
})
