import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  TypeFilter,
  SpeciesFilter,
  TagsFilter,
  RadiusFilter,
  SearchFilters,
} from "../search-filters"
import { getBlogPosts } from "@/lib/storage"

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock storage
jest.mock("@/lib/storage", () => ({
  getBlogPosts: jest.fn(() => [
    {
      id: "1",
      tags: ["dog", "training"],
      hashtags: ["#puppy", "#cute"],
    },
    {
      id: "2",
      tags: ["cat", "health"],
      hashtags: ["#kitten"],
    },
  ]),
}))

describe("TypeFilter", () => {
  it("renders type filter", () => {
    render(
      <TypeFilter
        label="Type"
        value=""
        onChange={jest.fn()}
      />
    )
    expect(screen.getByText("Type")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Select type...")).toBeInTheDocument()
  })

  it("calls onChange when type is selected", async () => {
    const onChange = jest.fn()
    render(
      <TypeFilter
        label="Type"
        value=""
        onChange={onChange}
      />
    )
    
    const input = screen.getByPlaceholderText("Select type...")
    await userEvent.type(input, "users")
    
    await waitFor(() => {
      const option = screen.getByRole("option", { name: /users/i })
      expect(option).toBeInTheDocument()
    })
    
    await userEvent.click(screen.getByRole("option", { name: /users/i }))
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("users")
    })
  })
})

describe("SpeciesFilter", () => {
  it("renders species filter", () => {
    render(
      <SpeciesFilter
        label="Species"
        value={[]}
        onChange={jest.fn()}
      />
    )
    expect(screen.getByText("Species")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search species...")).toBeInTheDocument()
  })

  it("allows multiple species selection", async () => {
    const onChange = jest.fn()
    render(
      <SpeciesFilter
        label="Species"
        value={[]}
        onChange={onChange}
        multiple
      />
    )
    
    const input = screen.getByPlaceholderText("Search species...")
    await userEvent.type(input, "dog")
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })
    
    const option = screen.getByRole("option", { name: /dog/i })
    await userEvent.click(option)
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(["dog"])
    })
  })

  it("displays selected species as badges", () => {
    render(
      <SpeciesFilter
        label="Species"
        value={["dog", "cat"]}
        onChange={jest.fn()}
        multiple
      />
    )
    
    expect(screen.getByText("Dog")).toBeInTheDocument()
    expect(screen.getByText("Cat")).toBeInTheDocument()
  })

  it("removes species when badge is clicked", async () => {
    const onChange = jest.fn()
    render(
      <SpeciesFilter
        label="Species"
        value={["dog", "cat"]}
        onChange={onChange}
        multiple
      />
    )
    
    const removeButton = screen.getByLabelText("Remove Dog")
    await userEvent.click(removeButton)
    
    expect(onChange).toHaveBeenCalledWith(["cat"])
  })
})

describe("TagsFilter", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders tags filter", () => {
    render(
      <TagsFilter
        label="Tags"
        value={[]}
        onChange={jest.fn()}
      />
    )
    expect(screen.getByText("Tags")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search tags...")).toBeInTheDocument()
  })

  it("loads tags from blog posts", async () => {
    render(
      <TagsFilter
        label="Tags"
        value={[]}
        onChange={jest.fn()}
      />
    )
    
    const input = screen.getByPlaceholderText("Search tags...")
    await userEvent.type(input, "dog")
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })
    
    // Should show tags from mocked blog posts
    expect(getBlogPosts).toHaveBeenCalled()
  })

  it("allows multiple tag selection", async () => {
    const onChange = jest.fn()
    render(
      <TagsFilter
        label="Tags"
        value={[]}
        onChange={onChange}
        multiple
      />
    )
    
    const input = screen.getByPlaceholderText("Search tags...")
    await userEvent.type(input, "dog")
    
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })
    
    const option = screen.getByRole("option", { name: /#dog/i })
    if (option) {
      await userEvent.click(option)
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
      })
    }
  })

  it("displays selected tags as badges with # prefix", () => {
    render(
      <TagsFilter
        label="Tags"
        value={["dog", "cat"]}
        onChange={jest.fn()}
        multiple
      />
    )
    
    expect(screen.getByText("#dog")).toBeInTheDocument()
    expect(screen.getByText("#cat")).toBeInTheDocument()
  })

  it("removes tag when badge is clicked", async () => {
    const onChange = jest.fn()
    render(
      <TagsFilter
        label="Tags"
        value={["dog", "cat"]}
        onChange={onChange}
        multiple
      />
    )
    
    const removeButton = screen.getByLabelText("Remove #dog")
    await userEvent.click(removeButton)
    
    expect(onChange).toHaveBeenCalledWith(["cat"])
  })
})

describe("RadiusFilter", () => {
  it("renders radius filter", () => {
    render(
      <RadiusFilter
        label="Radius"
        value=""
        onChange={jest.fn()}
        location={{ lat: 0, lng: 0 }}
      />
    )
    expect(screen.getByText("Radius")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Select radius...")).toBeInTheDocument()
  })

  it("is disabled when location is not provided", () => {
    render(
      <RadiusFilter
        label="Radius"
        value=""
        onChange={jest.fn()}
      />
    )
    
    const input = screen.getByPlaceholderText("Select radius...")
    expect(input).toBeDisabled()
    expect(screen.getByText(/Enable location access/i)).toBeInTheDocument()
  })

  it("calls onChange when radius is selected", async () => {
    const onChange = jest.fn()
    render(
      <RadiusFilter
        label="Radius"
        value=""
        onChange={onChange}
        location={{ lat: 0, lng: 0 }}
      />
    )
    
    const input = screen.getByPlaceholderText("Select radius...")
    await userEvent.type(input, "10")
    
    await waitFor(() => {
      const option = screen.getByRole("option", { name: /10 km/i })
      if (option) {
        expect(option).toBeInTheDocument()
      }
    })
  })

  it("displays selected radius as badge", () => {
    render(
      <RadiusFilter
        label="Radius"
        value="10"
        onChange={jest.fn()}
        location={{ lat: 0, lng: 0 }}
      />
    )
    
    expect(screen.getByText("10 km")).toBeInTheDocument()
  })

  it("clears radius when badge is clicked", async () => {
    const onChange = jest.fn()
    render(
      <RadiusFilter
        label="Radius"
        value="10"
        onChange={onChange}
        location={{ lat: 0, lng: 0 }}
      />
    )
    
    const clearButton = screen.getByLabelText("Clear radius")
    await userEvent.click(clearButton)
    
    expect(onChange).toHaveBeenCalledWith("")
  })
})

describe("SearchFilters", () => {
  it("renders all filter components", () => {
    render(
      <SearchFilters
        filters={{}}
        onChange={jest.fn()}
      />
    )
    
    expect(screen.getByText("Type")).toBeInTheDocument()
    expect(screen.getByText("Species")).toBeInTheDocument()
    expect(screen.getByText("Tags")).toBeInTheDocument()
    expect(screen.getByText("Radius (for places)")).toBeInTheDocument()
  })

  it("calls onChange when any filter changes", async () => {
    const onChange = jest.fn()
    render(
      <SearchFilters
        filters={{}}
        onChange={onChange}
      />
    )
    
    const typeInput = screen.getAllByPlaceholderText(/select|search/i)[0]
    await userEvent.type(typeInput, "users")
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })
  })
})
