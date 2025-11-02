"use client"

import { useState, useEffect } from "react"
import type { FlaggedRevision, FlaggedRevisionStatus } from "@/lib/types"
import {
  getFlaggedRevisions,
  getFlaggedRevisionById,
  getWikiRevisionById,
  getWikiArticleById,
  getUserById,
} from "@/lib/storage"
import {
  filterFlaggedRevisions,
  approveFlaggedRevision,
  rejectFlaggedRevision,
  getFlaggedRevisionAuditTrail,
  getFlaggedRevisionStats,
  type FlaggedRevisionFilter,
} from "@/lib/flagged-revisions"

export default function FlaggedRevisionsPage() {
  const [flaggedRevisions, setFlaggedRevisions] = useState<FlaggedRevision[]>([])
  const [filters, setFilters] = useState<FlaggedRevisionFilter>({})
  const [selectedRevision, setSelectedRevision] = useState<FlaggedRevision | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rationale, setRationale] = useState("")
  const [stats, setStats] = useState<ReturnType<typeof getFlaggedRevisionStats> | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<string>("admin-user") // TODO: Get from auth

  useEffect(() => {
    loadFlaggedRevisions()
    loadStats()
  }, [filters])

  const loadFlaggedRevisions = () => {
    const filtered = filterFlaggedRevisions(filters)
    setFlaggedRevisions(filtered)
  }

  const loadStats = () => {
    const statsData = getFlaggedRevisionStats()
    setStats(statsData)
  }

  const handleApprove = () => {
    if (!selectedRevision || !rationale.trim()) {
      alert("Please provide a rationale for approval")
      return
    }

    const result = approveFlaggedRevision(selectedRevision.id, currentUser, rationale)
    if (result.success) {
      setShowApproveDialog(false)
      setRationale("")
      setSelectedRevision(null)
      loadFlaggedRevisions()
      loadStats()
    } else {
      alert(`Failed to approve: ${result.error}`)
    }
  }

  const handleReject = () => {
    if (!selectedRevision || !rationale.trim()) {
      alert("Please provide a rationale for rejection")
      return
    }

    const result = rejectFlaggedRevision(selectedRevision.id, currentUser, rationale)
    if (result.success) {
      setShowRejectDialog(false)
      setRationale("")
      setSelectedRevision(null)
      loadFlaggedRevisions()
      loadStats()
    } else {
      alert(`Failed to reject: ${result.error}`)
    }
  }

  const handleViewDetails = (revision: FlaggedRevision) => {
    setSelectedRevision(revision)
    const logs = getFlaggedRevisionAuditTrail(revision.id)
    setAuditLogs(logs)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: FlaggedRevisionStatus) => {
    switch (status) {
      case "flagged":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Flagged Revisions Queue</h1>
        <p className="text-gray-600">Review and approve/reject Health/Regulatory content revisions</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Pending</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalPending}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Approved</div>
            <div className="text-2xl font-bold text-green-600">{stats.totalApproved}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Rejected</div>
            <div className="text-2xl font-bold text-red-600">{stats.totalRejected}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Avg Processing Time</div>
            <div className="text-2xl font-bold text-gray-600">{stats.avgProcessingTime.toFixed(1)}h</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value as FlaggedRevisionStatus || undefined })
              }
            >
              <option value="">All</option>
              <option value="flagged">Flagged</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.category || ""}
              onChange={(e) =>
                setFilters({ ...filters, category: (e.target.value as "health" | "regulatory") || undefined })
              }
            >
              <option value="">All</option>
              <option value="health">Health</option>
              <option value="regulatory">Regulatory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.priority || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  priority: (e.target.value as "low" | "medium" | "high" | "urgent") || undefined,
                })
              }
            >
              <option value="">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Age (hours)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.minAge || ""}
              onChange={(e) =>
                setFilters({ ...filters, minAge: e.target.value ? parseInt(e.target.value) : undefined })
              }
            />
          </div>
        </div>
      </div>

      {/* Revision List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Article
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flagged At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flaggedRevisions.map((revision) => {
              const article = getWikiArticleById(revision.articleId)
              const wikiRevision = getWikiRevisionById(revision.revisionId)
              const flaggedByUser = revision.flaggedBy ? getUserById(revision.flaggedBy) : null

              return (
                <tr key={revision.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{article?.title || "Unknown Article"}</div>
                    <div className="text-sm text-gray-500">Revision: {revision.revisionId.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(revision.status)}`}>
                      {revision.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {revision.category || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(revision.priority)}`}>
                      {revision.priority || "low"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(revision.flaggedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {(revision.status === "flagged" || revision.status === "pending") && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRevision(revision)
                            setShowApproveDialog(true)
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRevision(revision)
                            setShowRejectDialog(true)
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewDetails(revision)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {flaggedRevisions.length === 0 && (
          <div className="text-center py-12 text-gray-500">No flagged revisions found</div>
        )}
      </div>

      {/* Approve Dialog */}
      {showApproveDialog && selectedRevision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Approve Revision</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Article: {getWikiArticleById(selectedRevision.articleId)?.title || "Unknown"}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Flag Reason: {selectedRevision.flagReason || "N/A"}
              </p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rationale (required)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              rows={4}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain why you are approving this revision..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowApproveDialog(false)
                  setRationale("")
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && selectedRevision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject Revision</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Article: {getWikiArticleById(selectedRevision.articleId)?.title || "Unknown"}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Flag Reason: {selectedRevision.flagReason || "N/A"}
              </p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rationale (required)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              rows={4}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain why you are rejecting this revision..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRejectDialog(false)
                  setRationale("")
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedRevision && !showApproveDialog && !showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Revision Details</h3>
              <button
                onClick={() => {
                  setSelectedRevision(null)
                  setAuditLogs([])
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Article Information</h4>
                <p className="text-sm text-gray-600">
                  {getWikiArticleById(selectedRevision.articleId)?.title || "Unknown"}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Revision Content</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {getWikiRevisionById(selectedRevision.revisionId)?.content || "No content available"}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Flag Information</h4>
                <p className="text-sm text-gray-600">Reason: {selectedRevision.flagReason || "N/A"}</p>
                <p className="text-sm text-gray-600">
                  Flagged By: {selectedRevision.flaggedBy ? getUserById(selectedRevision.flaggedBy)?.fullName || selectedRevision.flaggedBy : "System"}
                </p>
                <p className="text-sm text-gray-600">Flagged At: {formatDate(selectedRevision.flaggedAt)}</p>
              </div>

              {selectedRevision.rationale && (
                <div>
                  <h4 className="font-semibold mb-2">Review Rationale</h4>
                  <p className="text-sm text-gray-600">{selectedRevision.rationale}</p>
                  {selectedRevision.reviewedBy && (
                    <p className="text-sm text-gray-500 mt-1">
                      Reviewed by: {getUserById(selectedRevision.reviewedBy)?.fullName || selectedRevision.reviewedBy}
                    </p>
                  )}
                  {selectedRevision.reviewedAt && (
                    <p className="text-sm text-gray-500">Reviewed at: {formatDate(selectedRevision.reviewedAt)}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Audit Log</h4>
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="bg-gray-50 p-3 rounded text-sm">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-gray-600">
                        By: {getUserById(log.performedBy)?.fullName || log.performedBy}
                      </div>
                      <div className="text-gray-600">At: {formatDate(log.performedAt)}</div>
                      {log.rationale && <div className="text-gray-600 mt-1">Rationale: {log.rationale}</div>}
                      {log.previousStatus && log.newStatus && (
                        <div className="text-gray-600">
                          Status: {log.previousStatus} → {log.newStatus}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

