import { describe, it, expect, beforeEach } from "@jest/globals"
import { usePrivacyCircle } from "../privacy-circle"

describe("usePrivacyCircle", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  })

  it("initializes with default value", () => {
    const state = usePrivacyCircle.getState()
    expect(state.lastSelectedCircle).toBe("followers-only")
  })

  it("updates lastSelectedCircle", () => {
    const initialState = usePrivacyCircle.getState()
    expect(initialState.lastSelectedCircle).toBe("followers-only")

    usePrivacyCircle.getState().setLastSelectedCircle("group-only")

    const updatedState = usePrivacyCircle.getState()
    expect(updatedState.lastSelectedCircle).toBe("group-only")
  })

  it("persists value across page reloads", () => {
    // Set a value
    usePrivacyCircle.getState().setLastSelectedCircle("close-friends")

    // Simulate page reload by creating new instance
    const persistedValue = localStorage.getItem("privacy-circle-storage")
    expect(persistedValue).toBeTruthy()

    // Parse and verify
    const parsed = JSON.parse(persistedValue!)
    expect(parsed.state.lastSelectedCircle).toBe("close-friends")
  })

  it("handles all privacy circle types", () => {
    const circles = ["followers-only", "group-only", "close-friends"] as const

    circles.forEach((circle) => {
      usePrivacyCircle.getState().setLastSelectedCircle(circle)
      expect(usePrivacyCircle.getState().lastSelectedCircle).toBe(circle)
    })
  })
})

