"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Search, Filter, MoreVertical, AlertTriangle, UserX, VolumeX } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User, UserRole, UserStatus } from "@/lib/types"
import { toast } from "sonner"

interface UserRow {
  id: string
  handle: string
  email: string
  roles: UserRole[]
  reputation: number
  strikes: number
  status: UserStatus
  createdAt: string
  lastSeen: string | null
  moderationCaseId: string | null
}

interface UserActionsDialogProps {
  user: UserRow | null
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

function UserActionsDialog({ user, open, onClose, onUpdate }: UserActionsDialogProps) {
  const [action, setAction] = useState<"adjustRoles" | "issueWarning" | "mute" | "suspend" | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [warningTemplate, setWarningTemplate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && open) {
      setRoles(user.roles || [])
      setAction(null)
      setWarningTemplate("")
      setExpiryDate("")
    }
  }, [user, open])

  const handleSubmit = async () => {
    if (!user || !action) return

    setLoading(true)
    try {
      const body: Record<string, unknown> = { action }

      if (action === "adjustRoles") {
        body.roles = roles
      } else if (action === "issueWarning") {
        body.warningTemplate = warningTemplate
      } else if (action === "mute" || action === "suspend") {
        if (!expiryDate) {
          toast.error("Please select an expiry date")
          setLoading(false)
          return
        }
        if (action === "mute") {
          body.muteExpiry = expiryDate
        } else {
          body.suspendExpiry = expiryDate
        }
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      toast.success("User updated successfully")
      onUpdate()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User: {user.handle}</DialogTitle>
          <DialogDescription>
            Select an action to perform on this user account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Action</label>
            <Select
              value={action || ""}
              onValueChange={(value) =>
                setAction(value as typeof action)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adjustRoles">Adjust Roles</SelectItem>
                <SelectItem value="issueWarning">Issue Warning</SelectItem>
                <SelectItem value="mute">Mute User</SelectItem>
                <SelectItem value="suspend">Suspend User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "adjustRoles" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Roles</label>
              <div className="space-y-2">
                {(["user", "moderator", "admin"] as UserRole[]).map((role) => (
                  <label key={role} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRoles([...roles, role])
                        } else {
                          setRoles(roles.filter((r) => r !== role))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {action === "issueWarning" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Warning Template (optional)
              </label>
              <Select
                value={warningTemplate}
                onValueChange={setWarningTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam Content</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="terms">Terms of Service Violation</SelectItem>
                  <SelectItem value="custom">Custom Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(action === "mute" || action === "suspend") && (
            <div>
              <label className="text-sm font-medium mb-2 block">Expiry Date</label>
              <Input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !action}>
            {loading ? "Processing..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      })
      if (search) params.append("search", search)
      if (roleFilter !== "all") params.append("role", roleFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      toast.error("Failed to load users")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, search, roleFilter, statusFilter])

  const handleUserAction = (user: UserRow) => {
    setSelectedUser(user)
    setActionsDialogOpen(true)
  }

  const getStatusBadgeClass = (status: UserStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "muted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "suspended":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "banned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <BackButton href="/admin" />
          <h1 className="text-3xl font-bold mt-4">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, roles, warnings, and account status
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>
              Filter users by role, status, or search by name/email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="Search by handle, email, name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value) => {
                setRoleFilter(value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split("-")
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder as "asc" | "desc")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="lastSeen-desc">Last Seen (Recent)</SelectItem>
                  <SelectItem value="reputation-desc">Highest Reputation</SelectItem>
                  <SelectItem value="strikes-desc">Most Strikes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No users found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Handle</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Reputation</TableHead>
                        <TableHead>Strikes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Appeal</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs">
                            {user.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">{user.handle}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.roles.map((role) => (
                                <span
                                  key={role}
                                  className="px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground capitalize"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{user.reputation}</TableCell>
                          <TableCell>
                            {user.strikes > 0 ? (
                              <span className="text-destructive font-semibold">
                                {user.strikes}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs rounded capitalize ${getStatusBadgeClass(user.status)}`}
                            >
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.createdAt
                              ? format(new Date(user.createdAt), "MMM d, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.lastSeen
                              ? format(new Date(user.lastSeen), "MMM d, yyyy")
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            {user.moderationCaseId ? (
                              <Link
                                href={`/admin/moderation?case=${user.moderationCaseId}`}
                                className="text-primary hover:underline text-sm"
                              >
                                View Case
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user)}
                                >
                                  Manage User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <UserActionsDialog
          user={selectedUser}
          open={actionsDialogOpen}
          onClose={() => {
            setActionsDialogOpen(false)
            setSelectedUser(null)
          }}
          onUpdate={fetchUsers}
        />
      </div>
    </div>
  )
}
