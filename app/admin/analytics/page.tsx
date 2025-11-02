"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range"
import type { DateRange } from "react-day-picker"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Shield,
  BookOpen,
  Search,
  Users,
} from "lucide-react"
import {
  getModerationAnalytics,
  getWikiAnalytics,
  getSearchAnalyticsTable,
  getCommunityAnalytics,
  exportToCSV,
  getTimezone,
} from "@/lib/utils/analytics-data"

type TabType = "moderation" | "wiki" | "search" | "community"

interface AnalyticsTabProps {
  rows: Array<{
    id: string
    date: string
    dateLocal: string
    type: string
    status?: string
    metric1: string
    metric2: string
    metric3: string
    details?: Record<string, unknown>
  }>
  metadata: {
    totalRows: number
    totalPages: number
    currentPage: number
    pageSize: number
    filters: Record<string, unknown>
    dateRange: { start: string; end: string }
    timezone: string
  }
  onPageChange: (page: number) => void
  onExport: () => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  isLoading: boolean
}

function AnalyticsTable({
  rows,
  metadata,
  onPageChange,
  onExport,
  dateRange,
  onDateRangeChange,
  isLoading,
  type,
}: AnalyticsTabProps & { type: TabType }) {
  const headers = {
    moderation: ["Date", "Type", "Status", "Reason", "Priority", "Age"],
    wiki: ["Date", "Type", "Status", "Title", "Category", "Author"],
    search: ["Date", "Type", "Query", "Results", "Content Type"],
    community: ["Date", "Type", "Name", "Members", "Topics"],
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <DatePickerWithRange date={dateRange} onDateChange={onDateRangeChange} />
          <div className="text-sm text-muted-foreground">
            Timezone: {metadata.timezone}
          </div>
        </div>
        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Data</CardTitle>
          <CardDescription>
            Showing {metadata.totalRows} total entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers[type].map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers[type].length} className="text-center py-8">
                      No data found for the selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">
                        {row.dateLocal}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.type}</Badge>
                      </TableCell>
                      {type !== "community" && type !== "search" && (
                        <TableCell>
                          {row.status && (
                            <Badge
                              variant={
                                row.status === "pending"
                                  ? "default"
                                  : row.status === "approved" || row.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {row.status}
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="max-w-md truncate">
                        {row.metric1}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {row.metric2}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {row.metric3}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {metadata.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {metadata.currentPage} of {metadata.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(metadata.currentPage - 1)}
                  disabled={metadata.currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(metadata.currentPage + 1)}
                  disabled={metadata.currentPage === metadata.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("moderation")
  const [currentPage, setCurrentPage] = useState(1)
  const [moderationType, setModerationType] = useState<"edits" | "reports" | "rollback" | "coi">("edits")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  // Data state
  const [moderationData, setModerationData] = useState<AnalyticsTabProps | null>(null)
  const [wikiData, setWikiData] = useState<AnalyticsTabProps | null>(null)
  const [searchData, setSearchData] = useState<AnalyticsTabProps | null>(null)
  const [communityData, setCommunityData] = useState<AnalyticsTabProps | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab, currentPage, moderationType, dateRange])

  const loadData = () => {
    setIsLoading(true)
    
    try {
      const startDate = dateRange?.from
      const endDate = dateRange?.to

      if (activeTab === "moderation") {
        const data = getModerationAnalytics({
          startDate,
          endDate,
          page: currentPage,
          pageSize: 50,
          type: moderationType,
        })
        setModerationData(data as unknown as AnalyticsTabProps)
      } else if (activeTab === "wiki") {
        const data = getWikiAnalytics({
          startDate,
          endDate,
          page: currentPage,
          pageSize: 50,
        })
        setWikiData(data as unknown as AnalyticsTabProps)
      } else if (activeTab === "search") {
        const data = getSearchAnalyticsTable({
          startDate,
          endDate,
          page: currentPage,
          pageSize: 50,
        })
        setSearchData(data as unknown as AnalyticsTabProps)
      } else if (activeTab === "community") {
        const data = getCommunityAnalytics({
          startDate,
          endDate,
          page: currentPage,
          pageSize: 50,
        })
        setCommunityData(data as unknown as AnalyticsTabProps)
      }
    } catch (error) {
      console.error("Failed to load analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const currentData =
      activeTab === "moderation"
        ? moderationData
        : activeTab === "wiki"
        ? wikiData
        : activeTab === "search"
        ? searchData
        : communityData

    if (!currentData) return

    const filename = `${activeTab}_analytics_${new Date().toISOString().split("T")[0]}.csv`
    const headers = {
      moderation: ["Date", "Type", "Status", "Reason", "Priority", "Age"],
      wiki: ["Date", "Type", "Status", "Title", "Category", "Author"],
      search: ["Date", "Type", "Query", "Results", "Content Type"],
      community: ["Date", "Type", "Name", "Members", "Topics"],
    }

    exportToCSV(currentData.rows, filename, headers[activeTab])
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setCurrentPage(1)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics for moderation, wiki, search, and community activities
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="wiki" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Wiki
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Community
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moderation">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Moderation Type:</label>
              <select
                value={moderationType}
                onChange={(e) => setModerationType(e.target.value as typeof moderationType)}
                className="px-3 py-1 border rounded-md"
              >
                <option value="edits">Edit Requests</option>
                <option value="reports">Article Reports</option>
                <option value="rollback">Rollback History</option>
                <option value="coi">COI Flags</option>
              </select>
            </div>
            {moderationData && (
              <AnalyticsTable
                {...moderationData}
                onPageChange={handlePageChange}
                onExport={handleExport}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                isLoading={isLoading}
                type="moderation"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="wiki">
          {wikiData && (
            <AnalyticsTable
              {...wikiData}
              onPageChange={handlePageChange}
              onExport={handleExport}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              isLoading={isLoading}
              type="wiki"
            />
          )}
        </TabsContent>

        <TabsContent value="search">
          {searchData && (
            <AnalyticsTable
              {...searchData}
              onPageChange={handlePageChange}
              onExport={handleExport}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              isLoading={isLoading}
              type="search"
            />
          )}
        </TabsContent>

        <TabsContent value="community">
          {communityData && (
            <AnalyticsTable
              {...communityData}
              onPageChange={handlePageChange}
              onExport={handleExport}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              isLoading={isLoading}
              type="community"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

