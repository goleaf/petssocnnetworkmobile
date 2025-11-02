/**
 * Admin Moderation Reports Page
 * 
 * Displays a table of moderation reports with filters and expandable case views
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Ban,
  Eye,
  EyeOff,
  Flag,
  MessageSquare,
  RefreshCw,
  Shield,
  UserX,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type {
  ModerationReport,
  ReportType,
  ReportStatus,
  ReportAge,
  ReporterReputation,
  BulkActionRequest,
} from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

export default function ModerationReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'warn' | 'mute' | 'shadowban' | 'suspend' | 'reject' | 'approve'>('warn')
  const [actionReason, setActionReason] = useState('')
  const [muteDays, setMuteDays] = useState(7)
  const [escalateToSenior, setEscalateToSenior] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')
  const [ageFilter, setAgeFilter] = useState<ReportAge>('all')
  const [reputationFilter, setReputationFilter] = useState<ReporterReputation>('all')

  useEffect(() => {
    loadReports()
  }, [typeFilter, statusFilter, ageFilter, reputationFilter])

  const loadReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (ageFilter !== 'all') params.append('age', ageFilter)
      if (reputationFilter !== 'all') params.append('reporterReputation', reputationFilter)

      const response = await fetch(`/api/admin/moderation/reports?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.items || [])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (reportId: string, action: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/moderation/reports/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: actionReason,
          muteDays: action === 'mute' ? muteDays : undefined,
          escalateToSenior,
        }),
      })

      if (response.ok) {
        await loadReports()
        setActionDialogOpen(false)
        setActionReason('')
        setExpandedReport(null)
      }
    } catch (error) {
      console.error('Error performing action:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkAction = async () => {
    if (selectedReports.size === 0) return

    setActionLoading(true)
    try {
      const bulkRequest: BulkActionRequest = {
        reportIds: Array.from(selectedReports),
        action: selectedAction,
        reason: actionReason,
        muteDays: selectedAction === 'mute' ? muteDays : undefined,
        escalateToSenior,
      }

      const response = await fetch('/api/admin/moderation/reports/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkRequest),
      })

      if (response.ok) {
        await loadReports()
        setBulkActionDialogOpen(false)
        setSelectedReports(new Set())
        setActionReason('')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleReportSelection = (reportId: string) => {
    const newSelected = new Set(selectedReports)
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId)
    } else {
      newSelected.add(reportId)
    }
    setSelectedReports(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set())
    } else {
      setSelectedReports(new Set(reports.map((r) => r.id)))
    }
  }

  const getStatusBadge = (status: ReportStatus) => {
    const variants: Record<ReportStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'destructive',
      triaged: 'secondary',
      closed: 'default',
    }
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: ReportType) => {
    const colors: Record<ReportType, string> = {
      spam: 'bg-yellow-100 text-yellow-800',
      abuse: 'bg-red-100 text-red-800',
      misinfo: 'bg-orange-100 text-orange-800',
      graphic: 'bg-purple-100 text-purple-800',
    }
    return (
      <Badge className={colors[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const getReputationBadge = (reputation?: ReporterReputation) => {
    if (!reputation || reputation === 'all') return null
    const colors: Record<ReporterReputation, string> = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
      all: '',
    }
    return (
      <Badge className={colors[reputation]}>
        {reputation.charAt(0).toUpperCase() + reputation.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Moderation Reports</h1>
          <p className="text-muted-foreground mt-1">
            Review and act on user reports
          </p>
        </div>
        <div className="flex gap-2">
          {selectedReports.size > 0 && (
            <Button
              onClick={() => setBulkActionDialogOpen(true)}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Action ({selectedReports.size})
            </Button>
          )}
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ReportType | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="abuse">Abuse</SelectItem>
                  <SelectItem value="misinfo">Misinformation</SelectItem>
                  <SelectItem value="graphic">Graphic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="triaged">Triaged</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age</Label>
              <Select value={ageFilter} onValueChange={(v) => setAgeFilter(v as ReportAge)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last-hour">Last Hour</SelectItem>
                  <SelectItem value="last-day">Last Day</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reporter Reputation</Label>
              <Select value={reputationFilter} onValueChange={(v) => setReputationFilter(v as ReporterReputation)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reputations</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports ({reports.length})</CardTitle>
          <CardDescription>
            Select reports to perform bulk actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedReports.size === reports.length && reports.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <>
                    <TableRow key={report.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedReports.has(report.id)}
                          onCheckedChange={() => toggleReportSelection(report.id)}
                        />
                      </TableCell>
                      <TableCell>{getTypeBadge(report.type)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {report.subjectContent || `${report.subjectType}:${report.subjectId}`}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{report.reporterId.slice(0, 8)}...</span>
                          {getReputationBadge(report.reporterReputation)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedReport(expandedReport === report.id ? null : report.id)
                            }
                          >
                            {expandedReport === report.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAction('warn')
                              setActionDialogOpen(true)
                              setExpandedReport(report.id)
                            }}
                          >
                            Actions
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedReport === report.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/50">
                          <CaseView report={report} onAction={handleAction} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take Action</DialogTitle>
            <DialogDescription>
              Select an action to take on this report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select
                value={selectedAction}
                onValueChange={(v) =>
                  setSelectedAction(v as 'warn' | 'mute' | 'shadowban' | 'suspend' | 'reject' | 'approve')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warn">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warn
                    </div>
                  </SelectItem>
                  <SelectItem value="mute">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Mute
                    </div>
                  </SelectItem>
                  <SelectItem value="shadowban">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Shadowban
                    </div>
                  </SelectItem>
                  <SelectItem value="suspend">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Suspend
                    </div>
                  </SelectItem>
                  <SelectItem value="reject">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Reject Report
                    </div>
                  </SelectItem>
                  <SelectItem value="approve">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Report
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedAction === 'mute' && (
              <div>
                <Label>Mute Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={muteDays}
                  onChange={(e) => setMuteDays(parseInt(e.target.value) || 7)}
                />
              </div>
            )}
            <div>
              <Label>Reason</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={escalateToSenior}
                onCheckedChange={setEscalateToSenior}
              />
              <Label>Escalate to senior moderator</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const reportId = expandedReport
                if (reportId) {
                  handleAction(reportId, selectedAction)
                }
              }}
              disabled={actionLoading || !actionReason.trim()}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
            <DialogDescription>
              Perform action on {selectedReports.size} selected reports
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select
                value={selectedAction}
                onValueChange={(v) =>
                  setSelectedAction(v as 'warn' | 'mute' | 'shadowban' | 'suspend' | 'reject' | 'approve')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="mute">Mute</SelectItem>
                  <SelectItem value="shadowban">Shadowban</SelectItem>
                  <SelectItem value="suspend">Suspend</SelectItem>
                  <SelectItem value="reject">Reject Report</SelectItem>
                  <SelectItem value="approve">Approve Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedAction === 'mute' && (
              <div>
                <Label>Mute Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={muteDays}
                  onChange={(e) => setMuteDays(parseInt(e.target.value) || 7)}
                />
              </div>
            )}
            <div>
              <Label>Reason Template</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason template..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={escalateToSenior}
                onCheckedChange={setEscalateToSenior}
              />
              <Label>Escalate to senior moderator</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={actionLoading || !actionReason.trim()}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Case View Component
function CaseView({
  report,
  onAction,
}: {
  report: ModerationReport
  onAction: (reportId: string, action: string) => void
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Subject Content Preview</h4>
          <div className="bg-muted p-3 rounded-md text-sm">
            {report.subjectContent || `${report.subjectType}:${report.subjectId}`}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Report Details</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Type:</span> {report.type}
            </div>
            <div>
              <span className="font-medium">Reason:</span> {report.reason}
            </div>
            <div>
              <span className="font-medium">Status:</span> {report.status}
            </div>
            {report.assignedTo && (
              <div>
                <span className="font-medium">Assigned to:</span> {report.assignedTo.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>
      </div>

      {report.evidence && report.evidence.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Evidence Gallery</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {report.evidence.map((item) => (
              <div key={item.id} className="bg-muted rounded-md p-2">
                {item.type === 'image' && item.url && (
                  <img src={item.url} alt="Evidence" className="w-full h-24 object-cover rounded" />
                )}
                {item.type === 'text' && (
                  <div className="text-xs p-2">{item.content}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {report.actorHistory && report.actorHistory.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Actor History</h4>
          <div className="space-y-2">
            {report.actorHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                <div>
                  <span className="font-medium">{item.actorName || item.actorId.slice(0, 8)}</span>
                  <span className="text-muted-foreground ml-2">{item.action}</span>
                </div>
                <div className="text-muted-foreground">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(report.id, 'warn')}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Warn
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(report.id, 'mute')}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Mute
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(report.id, 'shadowban')}
          >
            <EyeOff className="h-4 w-4 mr-1" />
            Shadowban
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(report.id, 'suspend')}
          >
            <Ban className="h-4 w-4 mr-1" />
            Suspend
          </Button>
        </div>
      </div>
    </div>
  )
}

