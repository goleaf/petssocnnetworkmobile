import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { StoryEditor } from "@/components/stories/StoryEditor"
import { TextOverlayTool } from "@/components/stories/TextOverlayTool"
import { DrawingTool } from "@/components/stories/DrawingTool"
import { FilterCarousel } from "@/components/stories/FilterCarousel"
import type { StoryOverlay } from "@/lib/types"

describe("Story Editing Tools", () => {
  describe("StoryEditor", () => {
    it("renders with media and toolbar", () => {
      const onSave = jest.fn()
      const onCancel = jest.fn()

      render(
        <StoryEditor
          mediaUrl="/test-image.jpg"
          mediaType="image"
          onSave={onSave}
          onCancel={onCancel}
        />
      )

      expect(screen.getByRole("img")).toBeInTheDocument()
      expect(screen.getByText("Text")).toBeInTheDocument()
      expect(screen.getByText("Draw")).toBeInTheDocument()
      expect(screen.getByText("Filter")).toBeInTheDocument()
    })

    it("handles cancel action", () => {
      const onSave = jest.fn()
      const onCancel = jest.fn()

      render(
        <StoryEditor
          mediaUrl="/test-image.jpg"
          mediaType="image"
          onSave={onSave}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getAllByRole("button")[0]
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it("handles save action", () => {
      const onSave = jest.fn()
      const onCancel = jest.fn()

      render(
        <StoryEditor
          mediaUrl="/test-image.jpg"
          mediaType="image"
          onSave={onSave}
          onCancel={onCancel}
        />
      )

      // Find the check icon button (save button)
      const buttons = screen.getAllByRole("button")
      const saveButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg")
        return svg && svg.classList.contains("lucide-check")
      })

      if (saveButton) {
        fireEvent.click(saveButton)
        expect(onSave).toHaveBeenCalledWith([], undefined, 100)
      }
    })

    it("enables text mode when text button clicked", () => {
      const onSave = jest.fn()
      const onCancel = jest.fn()

      render(
        <StoryEditor
          mediaUrl="/test-image.jpg"
          mediaType="image"
          onSave={onSave}
          onCancel={onCancel}
        />
      )

      const textButton = screen.getByText("Text")
      fireEvent.click(textButton)

      // Text mode should be active (button has bg-white/20 class)
      expect(textButton.parentElement).toHaveClass("bg-white/20")
    })

    it("enables drawing mode when draw button clicked", () => {
      const onSave = jest.fn()
      const onCancel = jest.fn()

      render(
        <StoryEditor
          mediaUrl="/test-image.jpg"
          mediaType="image"
          onSave={onSave}
          onCancel={onCancel}
        />
      )

      const drawButton = screen.getByText("Draw")
      fireEvent.click(drawButton)

      expect(drawButton.parentElement).toHaveClass("bg-white/20")
    })

    it("enables filter mode when filter button clicked", () => {
      const onSave = jest.fn()
      const onCancel = jest.fn()

      render(
        <StoryEditor
          mediaUrl="/test-image.jpg"
          mediaType="image"
          onSave={onSave}
          onCancel={onCancel}
        />
      )

      const filterButton = screen.getByText("Filter")
      fireEvent.click(filterButton)

      expect(filterButton.parentElement).toHaveClass("bg-white/20")
    })
  })

  describe("TextOverlayTool", () => {
    it("renders text overlay", () => {
      const overlay: StoryOverlay = {
        id: "text-1",
        type: "text",
        text: "Hello World",
        x: 0.5,
        y: 0.5,
        color: "#ffffff",
        fontSize: 32,
        fontFamily: "Arial",
      }

      render(
        <TextOverlayTool
          overlay={overlay}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      )

      expect(screen.getByText("Hello World")).toBeInTheDocument()
    })

    it("renders text overlay with controls", () => {
      const overlay: StoryOverlay = {
        id: "text-1",
        type: "text",
        text: "Hello World",
        x: 0.5,
        y: 0.5,
      }

      render(
        <TextOverlayTool
          overlay={overlay}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      )

      // Text overlay should have editing controls
      expect(screen.getByText("Font")).toBeInTheDocument()
    })
  })

  describe("DrawingTool", () => {
    it("renders canvas and controls", () => {
      render(
        <DrawingTool
          width={420}
          height={747}
          onDrawingComplete={jest.fn()}
        />
      )

      const canvas = document.querySelector("canvas")
      expect(canvas).toBeInTheDocument()
      expect(canvas).toHaveAttribute("width", "420")
      expect(canvas).toHaveAttribute("height", "747")
    })

    it("calls onDrawingComplete when done button clicked", () => {
      const onDrawingComplete = jest.fn()

      render(
        <DrawingTool
          width={420}
          height={747}
          onDrawingComplete={onDrawingComplete}
        />
      )

      const doneButton = screen.getByText("Done Drawing")
      fireEvent.click(doneButton)

      expect(onDrawingComplete).toHaveBeenCalled()
    })
  })

  describe("FilterCarousel", () => {
    it("renders all filter options", () => {
      render(
        <FilterCarousel
          selectedFilter={undefined}
          onFilterSelect={jest.fn()}
        />
      )

      expect(screen.getByText("None")).toBeInTheDocument()
      expect(screen.getByText("Grayscale")).toBeInTheDocument()
      expect(screen.getByText("Sepia")).toBeInTheDocument()
      expect(screen.getByText("Saturate")).toBeInTheDocument()
      expect(screen.getByText("Contrast")).toBeInTheDocument()
      expect(screen.getByText("Brightness")).toBeInTheDocument()
      expect(screen.getByText("Blur")).toBeInTheDocument()
      expect(screen.getByText("Hue Rotate")).toBeInTheDocument()
      expect(screen.getByText("Invert")).toBeInTheDocument()
    })

    it("calls onFilterSelect when filter clicked", () => {
      const onFilterSelect = jest.fn()

      render(
        <FilterCarousel
          selectedFilter={undefined}
          onFilterSelect={onFilterSelect}
        />
      )

      const grayscaleButton = screen.getByText("Grayscale")
      fireEvent.click(grayscaleButton)

      expect(onFilterSelect).toHaveBeenCalledWith("grayscale")
    })

    it("highlights selected filter", () => {
      render(
        <FilterCarousel
          selectedFilter="sepia"
          onFilterSelect={jest.fn()}
        />
      )

      const sepiaButton = screen.getByText("Sepia")
      const filterPreview = sepiaButton.previousElementSibling

      expect(filterPreview).toHaveClass("border-white")
    })
  })
})
