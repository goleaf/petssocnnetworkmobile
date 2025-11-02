"use client"

import { useEffect, useState } from "react"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Flag, 
  RefreshCw, 
  AlertCircle, 
  Power, 
  CheckCircle2,
  XCircle,
  Save,
  Plus,
  Trash2,
} from "lucide-react"
import { 
  getAllFlags, 
  updateFlag, 
  createFlag, 
  deleteFlag, 
  toggleKillSwitch,
} from "@/lib/actions/flags"
import type { FeatureFlag, FeatureFlags } from "@/lib/flags"
import { useAuth } from "@/lib/auth"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminFlagsPage() {
  const { user } = useAuth()
  const [flags, setFlags] = useState<FeatureFlags["flags"]>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const fetchFlags = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllFlags()
      setFlags(data.flags)
    } catch (err) {
      setError("Failed to load feature flags")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlags()
  }, [])

  const handleToggleKillSwitch = async (key: string, currentValue: boolean) => {
    setError(null)
    setSuccess(null)
    
    const result = await toggleKillSwitch({
      key,
      killSwitch: !currentValue,
      updatedBy: user?.id,
    })

    if (result.success) {
      setSuccess(`Kill switch ${!currentValue ? "enabled" : "disabled"} for ${key}`)
      await fetchFlags()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || "Failed to toggle kill switch")
    }
  }

  const handleUpdateFlag = async (formData: FormData) => {
    if (!editingFlag) return

    setError(null)
    setSuccess(null)

    const updates: Partial<FeatureFlag> = {}
    const enabled = formData.get("enabled") === "on"
    const killSwitch = formData.get("killSwitch") === "on"
    const rolloutPercentage = parseInt(formData.get("rolloutPercentage") as string) || 100
    const targetEnvironment = formData.get("targetEnvironment") as FeatureFlag["targetEnvironment"]

    updates.enabled = enabled
    updates.killSwitch = killSwitch
    updates.rolloutPercentage = rolloutPercentage
    updates.targetEnvironment = targetEnvironment

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const rolloutNotes = formData.get("rolloutNotes") as string

    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (rolloutNotes !== undefined) updates.rolloutNotes = rolloutNotes

    const result = await updateFlag({
      key: editingFlag.key,
      updates,
      updatedBy: user?.id,
    })

    if (result.success) {
      setSuccess(`Flag ${editingFlag.key} updated successfully`)
      setIsEditDialogOpen(false)
      setEditingFlag(null)
      await fetchFlags()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || "Failed to update flag")
    }
  }

  const handleCreateFlag = async (formData: FormData) => {
    setError(null)
    setSuccess(null)

    const key = formData.get("key") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string || ""
    const enabled = formData.get("enabled") === "on"
    const killSwitch = formData.get("killSwitch") === "on"
    const rolloutPercentage = parseInt(formData.get("rolloutPercentage") as string) || 100
    const targetEnvironment = formData.get("targetEnvironment") as FeatureFlag["targetEnvironment"]
    const rolloutNotes = formData.get("rolloutNotes") as string || ""

    const result = await createFlag({
      key,
      name,
      description,
      enabled,
      killSwitch,
      rolloutPercentage,
      targetEnvironment,
      rolloutNotes,
      updatedBy: user?.id,
    })

    if (result.success) {
      setSuccess(`Flag ${key} created successfully`)
      setIsCreateDialogOpen(false)
      await fetchFlags()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || "Failed to create flag")
    }
  }

  const handleDeleteFlag = async (key: string) => {
    if (!confirm(`Are you sure you want to delete flag ${key}?`)) {
      return
    }

    setError(null)
    setSuccess(null)

    const result = await deleteFlag({ key })

    if (result.success) {
      setSuccess(`Flag ${key} deleted successfully`)
      await fetchFlags()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || "Failed to delete flag")
    }
  }

  const getStatusBadge = (flag: FeatureFlag) => {
    if (flag.killSwitch) {
      return <Badge variant="destructive">Kill Switch Active</Badge>
    }
    if (!flag.enabled) {
      return <Badge variant="secondary">Disabled</Badge>
    }
    if (flag.rolloutPercentage < 100) {
      return <Badge variant="outline">{flag.rolloutPercentage}% Rollout</Badge>
    }
    return <Badge variant="default" className="bg-green-600">Enabled</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading feature flags...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <BackButton href="/admin" />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Flag className="w-8 h-8" />
                Feature Flags
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage feature flags and kill switches
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={fetchFlags}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Flag
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Feature Flag</DialogTitle>
                    <DialogDescription>
                      Create a new feature flag with validation
                    </DialogDescription>
                  </DialogHeader>
                  <form action={handleCreateFlag} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-key">Key *</Label>
                      <Input
                        id="create-key"
                        name="key"
                        placeholder="FEATURE_NAME"
                        required
                        pattern="^[A-Z_]+$"
                        title="Key must be uppercase with underscores"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-name">Name *</Label>
                      <Input
                        id="create-name"
                        name="name"
                        placeholder="Feature Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-description">Description</Label>
                      <Textarea
                        id="create-description"
                        name="description"
                        placeholder="Feature description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="create-rollout">Rollout Percentage</Label>
                        <Input
                          id="create-rollout"
                          name="rolloutPercentage"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-environment">Target Environment</Label>
                        <Select name="targetEnvironment" defaultValue="all">
                          <SelectTrigger id="create-environment">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="production">Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-notes">Rollout Notes</Label>
                      <Textarea
                        id="create-notes"
                        name="rolloutNotes"
                        placeholder="Notes about rollout strategy"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="create-enabled" name="enabled" defaultChecked />
                      <Label htmlFor="create-enabled">Enabled</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="create-killswitch" name="killSwitch" />
                      <Label htmlFor="create-killswitch">Kill Switch Active</Label>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        Create Flag
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {Object.values(flags).map((flag) => (
            <Card key={flag.key}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{flag.name}</CardTitle>
                      {getStatusBadge(flag)}
                    </div>
                    <CardDescription className="text-sm font-mono text-muted-foreground">
                      {flag.key}
                    </CardDescription>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground mt-2">{flag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingFlag(flag)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteFlag(flag.key)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      {flag.enabled && !flag.killSwitch ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {flag.enabled && !flag.killSwitch ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Rollout</p>
                    <p className="text-sm font-medium">{flag.rolloutPercentage}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Environment</p>
                    <p className="text-sm font-medium">{flag.targetEnvironment}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Kill Switch</p>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flag.killSwitch}
                        onCheckedChange={() => handleToggleKillSwitch(flag.key, flag.killSwitch)}
                      />
                      <span className="text-sm font-medium">
                        {flag.killSwitch ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
                {flag.rolloutNotes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Rollout Notes</p>
                    <p className="text-sm">{flag.rolloutNotes}</p>
                  </div>
                )}
                {flag.updatedBy && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Last updated by: {flag.updatedBy} at {new Date(flag.updatedAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.keys(flags).length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No feature flags found. Create one to get started.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Feature Flag</DialogTitle>
              <DialogDescription>
                Update feature flag settings
              </DialogDescription>
            </DialogHeader>
            {editingFlag && (
              <form action={handleUpdateFlag} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-key">Key</Label>
                  <Input
                    id="edit-key"
                    value={editingFlag.key}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingFlag.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingFlag.description}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-rollout">Rollout Percentage</Label>
                    <Input
                      id="edit-rollout"
                      name="rolloutPercentage"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={editingFlag.rolloutPercentage}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-environment">Target Environment</Label>
                    <Select name="targetEnvironment" defaultValue={editingFlag.targetEnvironment}>
                      <SelectTrigger id="edit-environment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Rollout Notes</Label>
                  <Textarea
                    id="edit-notes"
                    name="rolloutNotes"
                    defaultValue={editingFlag.rolloutNotes}
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-enabled"
                    name="enabled"
                    defaultChecked={editingFlag.enabled}
                  />
                  <Label htmlFor="edit-enabled">Enabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-killswitch"
                    name="killSwitch"
                    defaultChecked={editingFlag.killSwitch}
                  />
                  <Label htmlFor="edit-killswitch">Kill Switch Active</Label>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false)
                      setEditingFlag(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

