import { render, screen, waitFor } from "@testing-library/react"
import AnalyticsPage from "../page"

// Mock the analytics utilities
jest.mock("@/lib/utils/analytics-data", () => ({
  getModerationAnalytics: jest.fn(() => ({
    rows: [],
    metadata: {
      totalRows: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 50,
      filters: {},
      dateRange: { start: "", end: "" },
      timezone: "UTC",
    },
  })),
  getWikiAnalytics: jest.fn(() => ({
    rows: [],
    metadata: {
      totalRows: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 50,
      filters: {},
      dateRange: { start: "", end: "" },
      timezone: "UTC",
    },
  })),
  getSearchAnalyticsTable: jest.fn(() => ({
    rows: [],
    metadata: {
      totalRows: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 50,
      filters: {},
      dateRange: { start: "", end: "" },
      timezone: "UTC",
    },
  })),
  getCommunityAnalytics: jest.fn(() => ({
    rows: [],
    metadata: {
      totalRows: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 50,
      filters: {},
      dateRange: { start: "", end: "" },
      timezone: "UTC",
    },
  })),
  exportToCSV: jest.fn(),
  getTimezone: jest.fn(() => "UTC"),
}))

// Mock storage functions
jest.mock("@/lib/storage", () => ({
  getEditRequests: jest.fn(() => []),
  getArticleReports: jest.fn(() => []),
  getCOIFlags: jest.fn(() => []),
  getRollbackHistory: jest.fn(() => []),
  getBlogPosts: jest.fn(() => []),
  getWikiArticles: jest.fn(() => []),
  getWikiRevisions: jest.fn(() => []),
  getGroups: jest.fn(() => []),
  getGroupMembersByGroupId: jest.fn(() => []),
  getGroupTopicsByGroupId: jest.fn(() => []),
}))

// Mock search analytics
jest.mock("@/lib/utils/search-analytics", () => ({
  getAllEvents: jest.fn(() => []),
}))

// Mock date picker component
jest.mock("@/components/ui/date-picker-with-range", () => ({
  DatePickerWithRange: () => <div data-testid="date-picker">Date Picker</div>,
}))

describe("AnalyticsPage", () => {
  it("renders the analytics dashboard", async () => {
    render(<AnalyticsPage />)
    
    await waitFor(() => {
      expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument()
    })
  })

  it("renders all tabs", async () => {
    render(<AnalyticsPage />)
    
    await waitFor(() => {
      expect(screen.getByText("Moderation")).toBeInTheDocument()
      expect(screen.getByText("Wiki")).toBeInTheDocument()
      expect(screen.getByText("Search")).toBeInTheDocument()
      expect(screen.getByText("Community")).toBeInTheDocument()
    })
  })

  it("renders date picker in filters", async () => {
    render(<AnalyticsPage />)
    
    await waitFor(() => {
      expect(screen.getByTestId("date-picker")).toBeInTheDocument()
    })
  })
})

