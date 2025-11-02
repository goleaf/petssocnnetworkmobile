import { render, screen } from "@testing-library/react"
import { SearchAnalyticsDashboard } from "../SearchAnalyticsDashboard"

// Mock the analytics utilities
jest.mock("@/lib/utils/search-analytics", () => ({
  getSearchAnalyticsAggregation: jest.fn(() => ({
    period: "week",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-01-08T00:00:00.000Z",
    totalQueries: 1000,
    uniqueQueries: 750,
    averageQueryLength: 15,
    zeroResultQueries: 150,
    zeroResultRate: 15.0,
    topZeroResultQueries: [
      { query: "search term 1", count: 25 },
      { query: "search term 2", count: 20 },
      { query: "search term 3", count: 15 },
    ],
    totalResultClicks: 250,
    clickThroughRate: 25.0,
    clicksByContentType: {
      user: 50,
      pet: 100,
      blog: 50,
      wiki: 25,
      hashtag: 15,
      shelter: 5,
      group: 3,
      event: 2,
      all: 0,
    },
    queriesByContentType: {
      user: 200,
      pet: 400,
      blog: 200,
      wiki: 100,
      hashtag: 50,
      shelter: 30,
      group: 15,
      event: 5,
      all: 0,
    },
    topContentTypes: [
      { type: "pet", queries: 400 },
      { type: "user", queries: 200 },
      { type: "blog", queries: 200 },
      { type: "wiki", queries: 100 },
      { type: "hashtag", queries: 50 },
    ],
    filterUsageCount: 300,
    averageFiltersPerQuery: 1.5,
    mostUsedFilters: [
      { filterType: "species", count: 150 },
      { filterType: "location", count: 100 },
      { filterType: "age", count: 50 },
    ],
    dailyBreakdown: [
      { date: "2024-01-01", queries: 150, zeroResults: 25, clicks: 40, ctr: 26.7 },
      { date: "2024-01-02", queries: 140, zeroResults: 20, clicks: 35, ctr: 25.0 },
    ],
  })),
  getSearchAnalyticsSummary: jest.fn(() => ({
    totalQueries: 1000,
    totalZeroResultQueries: 150,
    totalClicks: 250,
    overallCTR: 25.0,
    overallZeroResultRate: 15.0,
    period: "week",
    generatedAt: "2024-01-08T00:00:00.000Z",
  })),
}))

describe("SearchAnalyticsDashboard", () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  it("renders dashboard title and description", () => {
    render(<SearchAnalyticsDashboard />)
    expect(screen.getByText("Search Analytics")).toBeInTheDocument()
    expect(screen.getByText(/Track search performance/)).toBeInTheDocument()
  })

  it("renders key metrics cards", async () => {
    render(<SearchAnalyticsDashboard />)
    
    expect(await screen.findByText("Total Queries")).toBeInTheDocument()
    expect(await screen.findByText("1,000")).toBeInTheDocument()
    expect(await screen.findByText("Zero Results")).toBeInTheDocument()
    expect(await screen.findByText("150")).toBeInTheDocument()
    expect(await screen.findByText("Click-Through Rate")).toBeInTheDocument()
    expect(await screen.findByText("25.0%")).toBeInTheDocument()
  })

  it("displays zero result queries", async () => {
    render(<SearchAnalyticsDashboard />)
    
    expect(await screen.findByText("Top Zero Result Queries")).toBeInTheDocument()
    expect(await screen.findByText("search term 1")).toBeInTheDocument()
    expect(await screen.findByText("25 searches")).toBeInTheDocument()
  })

  it("displays content type breakdown", async () => {
    render(<SearchAnalyticsDashboard />)
    
    expect(await screen.findByText("Searches by Content Type")).toBeInTheDocument()
    expect(await screen.findByText("pet")).toBeInTheDocument()
    expect(await screen.findByText("400")).toBeInTheDocument()
  })

  it("displays daily breakdown data", async () => {
    render(<SearchAnalyticsDashboard />)
    
    expect(await screen.findByText("Daily Trends")).toBeInTheDocument()
    expect(await screen.findByText("Jan 1")).toBeInTheDocument()
    expect(await screen.findByText(/150 queries/)).toBeInTheDocument()
  })

  it("handles period selection", async () => {
    render(<SearchAnalyticsDashboard />)
    
    expect(await screen.findByText("Last 7 days")).toBeInTheDocument()
  })

  it("displays loading state initially", () => {
    render(<SearchAnalyticsDashboard />)
    expect(screen.getByText(/Loading analytics/)).toBeInTheDocument()
  })
})

