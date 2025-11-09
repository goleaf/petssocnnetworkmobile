import React from "react"
import { render, screen, act } from "@testing-library/react"
import { useIsMdUp, useMediaQuery } from "@/lib/hooks/use-media-query"

type Listener = (event: MediaQueryListEvent) => void

// Simple matchMedia mock that supports add/removeEventListener and dispatching changes
function setupMatchMediaMock() {
  const listenersByQuery = new Map<string, Set<Listener>>()
  const matchesByQuery = new Map<string, boolean>()
  const mqlsByQuery = new Map<string, Set<MediaQueryList>>()

  function getSet(query: string): Set<Listener> {
    let set = listenersByQuery.get(query)
    if (!set) {
      set = new Set<Listener>()
      listenersByQuery.set(query, set)
    }
    return set
  }

  function setMatch(query: string, matches: boolean) {
    matchesByQuery.set(query, matches)
    const mqls = mqlsByQuery.get(query)
    if (mqls) mqls.forEach((mql) => ((mql as any).matches = matches))
    const set = getSet(query)
    const event = { matches, media: query } as MediaQueryListEvent
    set.forEach((listener) => listener(event))
  }

  // @ts-expect-error - we intentionally provide a minimal mock implementation
  window.matchMedia = (query: string): MediaQueryList => {
    const listeners = getSet(query)
    const mql: MediaQueryList = {
      media: query,
      matches: matchesByQuery.get(query) ?? false,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, cb: EventListenerOrEventListenerObject) => {
        if (typeof cb === "function") listeners.add(cb as Listener)
      },
      removeEventListener: (_: string, cb: EventListenerOrEventListenerObject) => {
        if (typeof cb === "function") listeners.delete(cb as Listener)
      },
      dispatchEvent: () => true,
    }
    let set = mqlsByQuery.get(query)
    if (!set) {
      set = new Set()
      mqlsByQuery.set(query, set)
    }
    set.add(mql)
    return mql
  }

  return { setMatch }
}

function ShowQuery({ query }: { query: string }) {
  const matches = useMediaQuery(query)
  return <div data-testid="q">{matches ? "true" : "false"}</div>
}

function ShowIsMdUp() {
  const isUp = useIsMdUp()
  return <div data-testid="md">{isUp ? "true" : "false"}</div>
}

describe("useMediaQuery", () => {
  test("responds to matchMedia changes", () => {
    const { setMatch } = setupMatchMediaMock()
    render(<ShowQuery query="(min-width: 768px)" />)

    expect(screen.getByTestId("q").textContent).toBe("false")

    act(() => setMatch("(min-width: 768px)", true))
    expect(screen.getByTestId("q").textContent).toBe("true")

    act(() => setMatch("(min-width: 768px)", false))
    expect(screen.getByTestId("q").textContent).toBe("false")
  })

  test("useIsMdUp convenience returns expected state", () => {
    const { setMatch } = setupMatchMediaMock()
    render(<ShowIsMdUp />)

    expect(screen.getByTestId("md").textContent).toBe("false")
    act(() => setMatch("(min-width: 768px)", true))
    expect(screen.getByTestId("md").textContent).toBe("true")
  })
})
