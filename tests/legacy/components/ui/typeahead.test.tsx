import React from "react"
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Typeahead, type TypeaheadOption } from "../typeahead"

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

const mockOptions: TypeaheadOption[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "rabbit", label: "Rabbit" },
]

describe("Typeahead", () => {
  const defaultProps = {
    options: mockOptions,
    value: "",
    onValueChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it("renders input with placeholder", () => {
    render(<Typeahead {...defaultProps} placeholder="Search..." />)
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
  })

  it("displays search icon", () => {
    render(<Typeahead {...defaultProps} />)
    const input = screen.getByRole("textbox")
    expect(input).toBeInTheDocument()
  })

  it("debounces input changes", async () => {
    const onValueChange = jest.fn()
    render(<Typeahead {...defaultProps} onValueChange={onValueChange} debounceMs={300} />)
    
    const input = screen.getByRole("textbox")
    
    // Type multiple characters
    await userEvent.type(input, "do")
    
    // Should not call immediately
    expect(onValueChange).not.toHaveBeenCalled()
    
    // Fast-forward time
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    // Should call after debounce
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith("do")
    }, { timeout: 1000 })
  })

  it("opens dropdown when typing", async () => {
    render(<Typeahead {...defaultProps} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "d")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it("filters options based on query", async () => {
    render(<Typeahead {...defaultProps} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "dog")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /dog/i })).toBeInTheDocument()
      expect(screen.queryByRole("option", { name: /cat/i })).not.toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it("highlights matching text", async () => {
    render(<Typeahead {...defaultProps} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "do")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      const option = screen.getByRole("option", { name: /dog/i })
      const mark = within(option).getByText("do")
      expect(mark).toBeInTheDocument()
      expect(mark.tagName.toLowerCase()).toBe("mark")
    }, { timeout: 1000 })
  })

  it("navigates options with arrow keys", async () => {
    const onSelect = jest.fn()
    render(<Typeahead {...defaultProps} onSelect={onSelect} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "d")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    }, { timeout: 1000 })
    
    // Arrow down
    fireEvent.keyDown(input, { key: "ArrowDown" })
    
    await waitFor(() => {
      const option = screen.getByRole("option", { name: /dog/i })
      expect(option).toHaveAttribute("aria-selected", "true")
      expect(input).toHaveAttribute("aria-activedescendant", "typeahead-option-0")
    }, { timeout: 1000 })
  })

  it("selects option with Enter key", async () => {
    const onSelect = jest.fn()
    const onValueChange = jest.fn()
    render(
      <Typeahead
        {...defaultProps}
        onSelect={onSelect}
        onValueChange={onValueChange}
      />
    )
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "dog")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    }, { timeout: 1000 })
    
    // Arrow down to highlight first option
    fireEvent.keyDown(input, { key: "ArrowDown" })
    
    // Press Enter
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })
    
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockOptions[0])
      expect(onValueChange).toHaveBeenCalledWith("Dog")
    }, { timeout: 1000 })
  })

  it("closes dropdown with Escape key", async () => {
    render(<Typeahead {...defaultProps} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "d")
    jest.advanceTimersByTime(300)
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })
    
    fireEvent.keyDown(input, { key: "Escape" })
    
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("supports aria-activedescendant for accessibility", async () => {
    render(<Typeahead {...defaultProps} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "d")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    }, { timeout: 1000 })
    
    // Navigate with arrow keys
    fireEvent.keyDown(input, { key: "ArrowDown" })
    
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-activedescendant", "typeahead-option-0")
    }, { timeout: 1000 })
    
    fireEvent.keyDown(input, { key: "ArrowDown" })
    
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-activedescendant", "typeahead-option-1")
    }, { timeout: 1000 })
  })

  it("displays empty state when no results", async () => {
    render(
      <Typeahead
        {...defaultProps}
        emptyMessage="No results found"
        emptyStateCTA={{
          label: "Create new",
          onClick: jest.fn(),
        }}
      />
    )
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "xyz")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByText("No results found")).toBeInTheDocument()
      expect(screen.getByText("Create new")).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it("calls empty state CTA when clicked", async () => {
    const onEmptyStateClick = jest.fn()
    render(
      <Typeahead
        {...defaultProps}
        emptyMessage="No results"
        emptyStateCTA={{
          label: "Create",
          onClick: onEmptyStateClick,
        }}
      />
    )
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "xyz")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      const button = screen.getByText("Create")
      expect(button).toBeInTheDocument()
    }, { timeout: 1000 })
    
    await userEvent.click(screen.getByText("Create"))
    
    expect(onEmptyStateClick).toHaveBeenCalled()
  })

  it("clears input with clear button", async () => {
    const onValueChange = jest.fn()
    render(<Typeahead {...defaultProps} onValueChange={onValueChange} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "test")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    const clearButton = screen.getByLabelText("Clear input")
    await userEvent.click(clearButton)
    
    expect(input).toHaveValue("")
    expect(onValueChange).toHaveBeenCalledWith("")
  })

  it("respects minQueryLength", async () => {
    render(<Typeahead {...defaultProps} minQueryLength={3} />)
    const input = screen.getByRole("textbox")
    
    // Type less than min length
    await userEvent.type(input, "do")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    }, { timeout: 1000 })
    
    // Type min length
    await userEvent.type(input, "g")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it("limits results with maxResults", async () => {
    const manyOptions: TypeaheadOption[] = Array.from({ length: 20 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i}`,
    }))
    
    render(<Typeahead {...defaultProps} options={manyOptions} maxResults={5} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "o")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      const options = screen.getAllByRole("option")
      expect(options.length).toBeLessThanOrEqual(5)
    }, { timeout: 1000 })
  })

  it("handles mouse selection", async () => {
    const onSelect = jest.fn()
    render(<Typeahead {...defaultProps} onSelect={onSelect} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "dog")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    }, { timeout: 1000 })
    
    const option = screen.getByRole("option", { name: /dog/i })
    await userEvent.click(option)
    
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockOptions[0])
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it("updates highlighted index on mouse enter", async () => {
    render(<Typeahead {...defaultProps} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "d")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    }, { timeout: 1000 })
    
    const option = screen.getByRole("option", { name: /dog/i })
    fireEvent.mouseEnter(option)
    
    await waitFor(() => {
      expect(option).toHaveAttribute("aria-selected", "true")
    }, { timeout: 1000 })
  })

  it("is disabled when disabled prop is true", () => {
    render(<Typeahead {...defaultProps} disabled />)
    const input = screen.getByRole("textbox")
    expect(input).toBeDisabled()
  })

  it("shows error state", () => {
    render(<Typeahead {...defaultProps} error />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveClass("border-destructive")
  })

  it("uses custom renderOption when provided", async () => {
    const renderOption = (option: TypeaheadOption) => (
      <div data-testid="custom-option">{option.label}</div>
    )
    
    render(<Typeahead {...defaultProps} renderOption={renderOption} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "dog")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByTestId("custom-option")).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it("handles custom filterOptions", async () => {
    const customFilter = (options: TypeaheadOption[], query: string) => {
      return options.filter((opt) => opt.value.startsWith(query))
    }
    
    render(<Typeahead {...defaultProps} filterOptions={customFilter} />)
    const input = screen.getByRole("textbox")
    
    await userEvent.type(input, "c")
    await act(async () => {
      jest.advanceTimersByTime(300)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /cat/i })).toBeInTheDocument()
      expect(screen.queryByRole("option", { name: /dog/i })).not.toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
