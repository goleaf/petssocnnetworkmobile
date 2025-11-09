"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth/auth-provider"
import {
  Webhook,
  ApiKey,
  WebhookStatus,
  WebhookHttpMethod,
} from "@/lib/types"
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  revokeApiKey,
  activateApiKey,
} from "@/lib/storage"
import { testWebhookDelivery } from "@/lib/utils/webhook"
import {
  Plus,
  Trash2,
  Edit,
  Play,
  Copy,
  Check,
  Key,
  Webhook as WebhookIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

const WEBHOOK_EVENTS = [
  "post.created",
  "post.updated",
  "post.deleted",
  "comment.created",
  "comment.updated",
  "comment.deleted",
  "user.registered",
  "user.updated",
  "pet.created",
  "pet.updated",
]

const API_KEY_SCOPES = [
  "read:posts",
  "write:posts",
  "read:comments",
  "write:comments",
  "read:users",
  "read:pets",
  "write:pets",
]

export default function IntegrationsSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null)

  // Webhook form state
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    url: "",
    method: "POST" as WebhookHttpMethod,
    events: [] as string[],
    secret: "",
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000,
    status: "active" as WebhookStatus,
  })

  // API key form state
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [newApiKey, setNewApiKey] = useState<ApiKey | null>(null)
  const [apiKeyForm, setApiKeyForm] = useState({
    name: "",
    scopes: [] as string[],
    expiresAt: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setWebhooks(getWebhooks())
    setApiKeys(getApiKeys())
  }

  const handleCreateWebhook = () => {
    setEditingWebhook(null)
    setWebhookForm({
      name: "",
      url: "",
      method: "POST",
      events: [],
      secret: "",
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30000,
      status: "active",
    })
    setWebhookDialogOpen(true)
  }

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook)
    setWebhookForm({
      name: webhook.name,
      url: webhook.url,
      method: webhook.method,
      events: webhook.events,
      secret: webhook.secret || "",
      retryCount: webhook.retryCount,
      retryDelay: webhook.retryDelay,
      timeout: webhook.timeout,
      status: webhook.status,
    })
    setWebhookDialogOpen(true)
  }

  const handleSaveWebhook = () => {
    if (!webhookForm.name || !webhookForm.url) {
      toast.error("Name and URL are required")
      return
    }

    try {
      if (editingWebhook) {
        const result = updateWebhook(editingWebhook.id, webhookForm)
        if (!result.success) {
          toast.error(result.error || "Failed to update webhook")
          return
        }
        toast.success("Webhook updated successfully")
      } else {
        createWebhook(webhookForm)
        toast.success("Webhook created successfully")
      }
      setWebhookDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error("Failed to save webhook")
    }
  }

  const handleDeleteWebhook = (webhookId: string) => {
    const result = deleteWebhook(webhookId)
    if (result.success) {
      toast.success("Webhook deleted successfully")
      loadData()
    } else {
      toast.error(result.error || "Failed to delete webhook")
    }
  }

  const handleTestWebhook = async (webhook: Webhook) => {
    setTestingWebhookId(webhook.id)
    try {
      const result = await testWebhookDelivery(webhook)
      if (result.success) {
        toast.success("Test delivery successful")
      } else {
        toast.error(result.error || "Test delivery failed")
      }
      loadData()
    } catch (error) {
      toast.error("Failed to test webhook")
    } finally {
      setTestingWebhookId(null)
    }
  }

  const handleCreateApiKey = () => {
    setNewApiKey(null)
    setApiKeyForm({
      name: "",
      scopes: [],
      expiresAt: "",
    })
    setApiKeyDialogOpen(true)
  }

  const handleSaveApiKey = () => {
    if (!apiKeyForm.name) {
      toast.error("Name is required")
      return
    }

    try {
      const result = createApiKey(
        apiKeyForm.name,
        apiKeyForm.scopes,
        apiKeyForm.expiresAt || undefined
      )
      if (result.success && result.apiKey) {
        setNewApiKey(result.apiKey)
        setApiKeyForm({ name: "", scopes: [], expiresAt: "" })
        toast.success("API key created successfully")
      } else {
        toast.error(result.error || "Failed to create API key")
      }
    } catch (error) {
      toast.error("Failed to create API key")
    }
  }

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success("API key copied to clipboard")
  }

  const handleRevokeApiKey = (keyId: string) => {
    const result = revokeApiKey(keyId)
    if (result.success) {
      toast.success("API key revoked")
      loadData()
    } else {
      toast.error(result.error || "Failed to revoke API key")
    }
  }

  const handleActivateApiKey = (keyId: string) => {
    const result = activateApiKey(keyId)
    if (result.success) {
      toast.success("API key activated")
      loadData()
    } else {
      toast.error(result.error || "Failed to activate API key")
    }
  }

  const handleDeleteApiKey = (keyId: string) => {
    const result = deleteApiKey(keyId)
    if (result.success) {
      toast.success("API key deleted")
      loadData()
    } else {
      toast.error(result.error || "Failed to delete API key")
    }
  }

  const toggleWebhookEvent = (event: string) => {
    setWebhookForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  const toggleApiKeyScope = (scope: string) => {
    setApiKeyForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }))
  }

  const getStatusBadge = (status: WebhookStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Paused
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <SettingsHeader description="Manage webhooks and API keys for external integrations." />
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks">
            <WebhookIcon className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure webhooks to receive real-time notifications about events
                  </CardDescription>
                </div>
                <Button onClick={handleCreateWebhook}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WebhookIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No webhooks configured</p>
                  <p className="text-sm mt-2">Create your first webhook to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <Card key={webhook.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{webhook.name}</h3>
                              {getStatusBadge(webhook.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {webhook.method} {webhook.url}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {webhook.events.map((event) => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                            {webhook.lastDeliveryAt && (
                              <p className="text-xs text-muted-foreground">
                                Last delivery: {new Date(webhook.lastDeliveryAt).toLocaleString()}{" "}
                                {webhook.lastDeliveryStatus === "success" ? (
                                  <CheckCircle2 className="h-3 w-3 inline text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 inline text-red-500" />
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestWebhook(webhook)}
                              disabled={testingWebhookId === webhook.id || webhook.status !== "active"}
                            >
                              {testingWebhookId === webhook.id ? (
                                <Clock className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditWebhook(webhook)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    webhook.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteWebhook(webhook.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for programmatic access to your account
                  </CardDescription>
                </div>
                <Button onClick={handleCreateApiKey}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys configured</p>
                  <p className="text-sm mt-2">Create your first API key to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <Card key={apiKey.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{apiKey.name}</h3>
                              {apiKey.isActive ? (
                                <Badge variant="default" className="bg-green-500">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Revoked</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 font-mono">
                              {apiKey.keyPrefix}...
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {apiKey.scopes.map((scope) => (
                                <Badge key={scope} variant="outline" className="text-xs">
                                  {scope}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(apiKey.createdAt).toLocaleString()}
                              {apiKey.lastUsedAt && (
                                <> • Last used: {new Date(apiKey.lastUsedAt).toLocaleString()}</>
                              )}
                              {apiKey.expiresAt && (
                                <> • Expires: {new Date(apiKey.expiresAt).toLocaleString()}</>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {apiKey.isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeApiKey(apiKey.id)}
                              >
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActivateApiKey(apiKey.id)}
                              >
                                Activate
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    API key.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteApiKey(apiKey.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Webhook Dialog */}
      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? "Edit Webhook" : "Create Webhook"}</DialogTitle>
            <DialogDescription>
              Configure webhook endpoint and events to receive notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-name">Name</Label>
              <Input
                id="webhook-name"
                value={webhookForm.name}
                onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                placeholder="My Webhook"
              />
            </div>
            <div>
              <Label htmlFor="webhook-url">URL</Label>
              <Input
                id="webhook-url"
                value={webhookForm.url}
                onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                placeholder="https://example.com/webhook"
                type="url"
              />
            </div>
            <div>
              <Label htmlFor="webhook-method">HTTP Method</Label>
              <Select
                value={webhookForm.method}
                onValueChange={(value) =>
                  setWebhookForm({ ...webhookForm, method: value as WebhookHttpMethod })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`event-${event}`}
                      checked={webhookForm.events.includes(event)}
                      onChange={() => toggleWebhookEvent(event)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`event-${event}`} className="text-sm cursor-pointer">
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="webhook-secret">HMAC Secret (optional)</Label>
              <Input
                id="webhook-secret"
                value={webhookForm.secret}
                onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
                placeholder="Leave empty to disable HMAC signing"
                type="password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used to sign webhook payloads for verification
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="retry-count">Retry Count</Label>
                <Input
                  id="retry-count"
                  type="number"
                  min="1"
                  max="10"
                  value={webhookForm.retryCount}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, retryCount: parseInt(e.target.value) || 3 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="retry-delay">Retry Delay (ms)</Label>
                <Input
                  id="retry-delay"
                  type="number"
                  min="100"
                  step="100"
                  value={webhookForm.retryDelay}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, retryDelay: parseInt(e.target.value) || 1000 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="1000"
                  step="1000"
                  value={webhookForm.timeout}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, timeout: parseInt(e.target.value) || 30000 })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="webhook-active"
                checked={webhookForm.status === "active"}
                onCheckedChange={(checked) =>
                  setWebhookForm({ ...webhookForm, status: checked ? "active" : "paused" })
                }
              />
              <Label htmlFor="webhook-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWebhook}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent>
          {newApiKey ? (
            <>
              <DialogHeader>
                <DialogTitle>API Key Created</DialogTitle>
                <DialogDescription>
                  Copy this key now. You won&apos;t be able to see it again!
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input value={newApiKey.key} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      onClick={() => handleCopyApiKey(newApiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Make sure to copy this key. It will not be shown again.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setApiKeyDialogOpen(false)
                  setNewApiKey(null)
                  loadData()
                }}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for programmatic access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-key-name">Name</Label>
                  <Input
                    id="api-key-name"
                    value={apiKeyForm.name}
                    onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                    placeholder="My API Key"
                  />
                </div>
                <div>
                  <Label>Scopes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {API_KEY_SCOPES.map((scope) => (
                      <div key={scope} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`scope-${scope}`}
                          checked={apiKeyForm.scopes.includes(scope)}
                          onChange={() => toggleApiKeyScope(scope)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`scope-${scope}`} className="text-sm cursor-pointer">
                          {scope}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="api-key-expires">Expires At (optional)</Label>
                  <Input
                    id="api-key-expires"
                    type="datetime-local"
                    value={apiKeyForm.expiresAt}
                    onChange={(e) => setApiKeyForm({ ...apiKeyForm, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveApiKey}>Create</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
