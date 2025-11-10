"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ErrorText } from "@/components/ui/error-text"
import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { useAuth } from "@/components/auth/auth-provider"
import { PrivacySelector } from "@/components/privacy-selector"
import { BlurToggle } from "@/components/moderation/blur-toggle"
import { updateUser, getUsers, blockUser, unblockUser, isExpertVerified, getExpertVerificationRequestByUserId } from "@/lib/storage"
import { getNotificationSettings, saveNotificationSettings } from "@/lib/notifications"
import { requestEmailChangeAction, updatePasswordAction, logoutAllDevicesAction, requestAccountDeletionAction } from "@/lib/actions/account"
import { getActiveSessionsAction, logoutSessionAction, logoutAllOtherSessionsAction, renameSessionDeviceAction } from "@/lib/actions/sessions"
import type { PrivacyLevel, NotificationSettings, NotificationChannel } from "@/lib/types"
import {
  ArrowLeft,
  Ban,
  UserX,
  User,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  ShieldCheck,
  Globe,
  Star,
  Lock,
  Mail,
  Bell,
  Smartphone,
  GraduationCap,
  Webhook,
  Key,
  type LucideIcon,
} from "lucide-react"
import { Eye, EyeOff, LogOut, Monitor, Pencil, Check, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { RelativeTime } from "@/components/ui/relative-time"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { usePreferences } from "@/lib/preferences"

const CHANNEL_SUMMARY_ORDER: NotificationChannel[] = ["in_app", "push", "email", "digest"]

const CHANNEL_SUMMARY_META: Record<NotificationChannel, { label: string; icon: LucideIcon; description: string }> = {
  in_app: {
    label: "In-app",
    icon: Bell,
    description: "Delivered instantly while you're using the app",
  },
  push: {
    label: "Push",
    icon: Smartphone,
    description: "Native notifications on your device",
  },
  email: {
    label: "Email",
    icon: Mail,
    description: "Summaries and alerts delivered to your inbox",
  },
  digest: {
    label: "Digest",
    icon: LayoutGrid,
    description: "Scheduled recap at your preferred cadence",
  },
}

export default function SettingsPage() {
  const { user, refresh } = useAuth()
  const { feedAutoLoad, setFeedAutoLoad } = usePreferences((s) => ({ feedAutoLoad: s.feedAutoLoad, setFeedAutoLoad: s.setFeedAutoLoad }))
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const localePath = pathname?.split("/")[1] || "en"
  const starredHref = `/${localePath}/settings/starred`
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [privacySettings, setPrivacySettings] = useState({
    profile: "public" as PrivacyLevel,
    email: "private" as PrivacyLevel,
    location: "followers-only" as PrivacyLevel,
    pets: "public" as PrivacyLevel,
    posts: "public" as PrivacyLevel,
    followers: "public" as PrivacyLevel,
    following: "public" as PrivacyLevel,
    searchable: true,
    allowFollowRequests: "public" as PrivacyLevel,
    allowTagging: "public" as PrivacyLevel,
    secureMessages: true,
    sections: {
      basics: "public" as PrivacyLevel,
      statistics: "public" as PrivacyLevel,
      friends: "public" as PrivacyLevel,
      pets: "public" as PrivacyLevel,
      activity: "public" as PrivacyLevel,
    },
  })
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  // Email change dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [sendVerification, setSendVerification] = useState(true)
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  // Password change state
  const [curPassVisible, setCurPassVisible] = useState(false)
  const [newPassVisible, setNewPassVisible] = useState(false)
  const [confirmPassVisible, setConfirmPassVisible] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  // Account deletion modal state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)
  const [deleteReason, setDeleteReason] = useState<string>("")
  const [deleteReasonOther, setDeleteReasonOther] = useState<string>("")
  const [deletePassword, setDeletePassword] = useState<string>("")
  const [deleteTypeText, setDeleteTypeText] = useState<string>("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Session management state
  const [sessions, setSessions] = useState<Array<{
    token: string
    customName?: string
    deviceName?: string
    deviceType?: string
    os?: string
    browser?: string
    ip?: string
    city?: string
    country?: string
    createdAt: string
    lastActivityAt: string
    revoked?: boolean
    isCurrent?: boolean
  }> | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [editingToken, setEditingToken] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState<string>("")
  const [renameSaving, setRenameSaving] = useState<boolean>(false)
  // Verification Request UI state
  const [isVerifOpen, setIsVerifOpen] = useState(false)
  const [verifName, setVerifName] = useState("")
  const [verifReason, setVerifReason] = useState("")
  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack] = useState<File | null>(null)
  const [proofFiles, setProofFiles] = useState<File[]>([])
  const [bizDocs, setBizDocs] = useState<File[]>([])
  const [isSubmittingVerif, setIsSubmittingVerif] = useState(false)

  // Handle success/error messages from URL params
  useEffect(() => {
    const status = searchParams.get("status")
    if (status === "success") {
      setMessage({ type: "success", text: "Settings saved successfully!" })
      const timer = setTimeout(() => {
        setMessage(null)
        router.replace("/settings")
      }, 5000)
      return () => clearTimeout(timer)
    } else if (status === "error") {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." })
      const timer = setTimeout(() => {
        setMessage(null)
        router.replace("/settings")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  // Load user data
  useEffect(() => {
    if (user) {
      // Load privacy settings
      if (user.privacy) {
        setPrivacySettings({
          profile: user.privacy.profile || "public",
          email: user.privacy.email || "private",
          location: user.privacy.location || "followers-only",
          pets: user.privacy.pets || "public",
          posts: user.privacy.posts || "public",
          followers: user.privacy.followers || "public",
          following: user.privacy.following || "public",
          searchable: user.privacy.searchable !== false,
          allowFollowRequests: user.privacy.allowFollowRequests || "public",
          allowTagging: user.privacy.allowTagging || "public",
          secureMessages: user.privacy.secureMessages !== false,
          sections: {
            basics: user.privacy.sections?.basics || user.privacy.profile || "public",
            statistics: user.privacy.sections?.statistics || user.privacy.profile || "public",
            friends:
              user.privacy.sections?.friends ||
              user.privacy.followers ||
              user.privacy.following ||
              user.privacy.profile ||
              "public",
            pets: user.privacy.sections?.pets || user.privacy.pets || "public",
            activity: user.privacy.sections?.activity || user.privacy.posts || "public",
          },
        })
      }
      
      // Load notification settings
      const storedNotificationSettings = getNotificationSettings(user.id)
      setNotificationSettings(storedNotificationSettings)
      
      // Load blocked users
      if (user.blockedUsers && user.blockedUsers.length > 0) {
        const allUsers = getUsers()
        const blocked = allUsers.filter((u) => user.blockedUsers!.includes(u.id))
        setBlockedUsers(blocked)
      }
      // Load active sessions
      setIsLoadingSessions(true)
      getActiveSessionsAction()
        .then((res) => {
          if (res.success) setSessions(res.sessions || [])
        })
        .finally(() => setIsLoadingSessions(false))
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      // Simulate async operation (in case updateUser becomes async in the future)
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      // Save privacy settings
      updateUser(user.id, { privacy: privacySettings })
      
      // Save notification settings
      if (notificationSettings) {
        saveNotificationSettings({ ...notificationSettings, userId: user.id })
      }
      
      // Redirect with success message
      router.push("/settings?status=success")
      router.refresh()
    } catch (error) {
      // Redirect with error message
      router.push("/settings?status=error")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblock = (unblockUserId: string) => {
    if (!user) return
    unblockUser(user.id, unblockUserId)
    setBlockedUsers(blockedUsers.filter((u) => u.id !== unblockUserId))
  }

  const passwordStrength = (() => {
    let score = 0
    const pwd = newPassword
    if (pwd.length >= 8) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[!@#$%^&*]/.test(pwd)) score++
    const value = Math.min(100, Math.round((score / 5) * 100))
    let label: "weak" | "fair" | "good" | "strong" = "weak"
    if (value >= 80) label = "strong"
    else if (value >= 60) label = "good"
    else if (value >= 40) label = "fair"
    return { value, label }
  })()

  const canSubmitPassword =
    !!user &&
    newPassword.length >= 8 &&
    /[a-z]/.test(newPassword) &&
    /[A-Z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    /[!@#$%^&*]/.test(newPassword) &&
    newPassword === confirmPassword

  const handleUpdatePassword = async () => {
    if (!user) return
    setPasswordError(null)
    if (!canSubmitPassword) {
      setPasswordError("Please meet password requirements and confirm correctly")
      return
    }
    setPasswordSubmitting(true)
    try {
      const result = await updatePasswordAction({ userId: user.id, currentPassword, newPassword })
      if (!result.success) {
        setPasswordError(result.error || "Failed to update password")
        return
      }
      setMessage({ type: "success", text: "Password updated successfully" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e: any) {
      setPasswordError(e?.message || "Failed to update password")
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const handleLogoutAll = async () => {
    if (!user) return
    const res = await logoutAllDevicesAction(user.id)
    if (res.success) {
      router.push("/login")
    }
  }

  const canAdvanceDeleteStep = () => {
    if (deleteStep === 1) return deleteConfirmChecked
    if (deleteStep === 2) return !!deleteReason && (deleteReason !== 'other' || deleteReasonOther.trim().length > 0)
    if (deleteStep === 3) return deletePassword.length > 0
    if (deleteStep === 4) return deleteTypeText === 'DELETE'
    return false
  }

  const resetDeletionState = () => {
    setDeleteOpen(false)
    setDeleteStep(1)
    setDeleteConfirmChecked(false)
    setDeleteReason("")
    setDeleteReasonOther("")
    setDeletePassword("")
    setDeleteTypeText("")
    setDeleting(false)
    setDeleteError(null)
  }

  const handleConfirmDeletion = async () => {
    if (!user) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const result = await requestAccountDeletionAction({
        userId: user.id,
        password: deletePassword,
        reason: deleteReason,
        otherReason: deleteReason === 'other' ? deleteReasonOther : undefined,
      })
      if (!result.success) {
        setDeleteError(result.error || 'Failed to schedule deletion')
        setDeleting(false)
        return
      }
      // Redirect to login after immediate logout
      router.push('/login')
    } catch (e: any) {
      setDeleteError(e?.message || 'Failed to schedule deletion')
      setDeleting(false)
    }
  }

  const maskIp = (ip?: string) => {
    if (!ip) return "—"
    if (ip.includes(":")) return ip.slice(0, 6) + "…" // IPv6 short mask
    const parts = ip.split(".")
    if (parts.length !== 4) return ip
    return `${parts[0]}.${parts[1]}..`
  }

  const refreshSessions = async () => {
    setIsLoadingSessions(true)
    const res = await getActiveSessionsAction()
    if (res.success) setSessions(res.sessions || [])
    setIsLoadingSessions(false)
  }

  const handleLogoutSession = async (token: string) => {
    await logoutSessionAction(token)
    await refreshSessions()
  }

  const handleLogoutAllOthers = async () => {
    await logoutAllOtherSessionsAction()
    await refreshSessions()
  }

  const startRename = (token: string, currentName?: string) => {
    setEditingToken(token)
    setNameDraft(currentName || "")
  }

  const cancelRename = () => {
    setEditingToken(null)
    setNameDraft("")
  }

  const saveRename = async () => {
    if (!editingToken) return
    try {
      setRenameSaving(true)
      await renameSessionDeviceAction(editingToken, nameDraft)
      await refreshSessions()
      setEditingToken(null)
      setNameDraft("")
    } finally {
      setRenameSaving(false)
    }
  }

  const handleEmailChange = async () => {
    if (!user) return
    setEmailError(null)
    // Basic email format validation
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError("Enter a valid email address")
      return
    }
    if (!currentPassword) {
      setEmailError("Enter your current password to confirm")
      return
    }

    setEmailSubmitting(true)
    try {
      const result = await requestEmailChangeAction({
        userId: user.id,
        newEmail,
        currentPassword,
        sendVerification,
      })
      if (!result.success) {
        setEmailError(result.error || "Failed to request email change")
        return
      }
      setEmailDialogOpen(false)
      setNewEmail("")
      setCurrentPassword("")
      setSendVerification(true)
      setMessage({ type: "success", text: `Verification sent. Pending verification: ${newEmail}` })
      await refresh()
    } catch (e: any) {
      setEmailError(e?.message || "Failed to request email change")
    } finally {
      setEmailSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
      <div className="space-y-4 sm:space-y-6">
        <SettingsHeader description="Manage your account preferences, privacy, and notifications." />
        {/* Success/Error Message */}
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className={message.type === "success" ? "border-green-500/50 bg-green-500/10" : ""}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="text-green-500" />
            ) : (
              <XCircle className="text-destructive" />
            )}
            <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        {/* Feed Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Feed Preferences</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Control how your feed loads more posts.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">Auto-load more on scroll</div>
              <p className="text-xs text-muted-foreground">Automatically load more items when you reach the bottom.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="pref-feed-autoload" checked={feedAutoLoad} onCheckedChange={setFeedAutoLoad} />
              <Label htmlFor="pref-feed-autoload">{feedAutoLoad ? "On" : "Off"}</Label>
            </div>
          </CardContent>
        </Card>
        {/* Email Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              </div>
              Email Management
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              View your current email and manage verification or changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-sm">Current email</div>
                <div className="font-medium">{user.email}</div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                  {user.emailVerified ? (
                    <Badge variant="outline" className="border-green-500/50 text-green-600">Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">Unverified</Badge>
                  )}
                  {user.emailVerification?.pendingEmail && (
                    <span>
                      Pending verification: <span className="font-medium">{user.emailVerification.pendingEmail}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!user.emailVerified && (
                  <Button asChild variant="outline">
                    <Link href="/verify-email">Verify Email</Link>
                  </Button>
                )}
                <Button onClick={() => setEmailDialogOpen(true)}>Change Email</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
              </div>
              Change Password
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Update your password. Use at least 8 characters including uppercase, lowercase, number, and special character.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={curPassVisible ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setCurPassVisible((v) => !v)}
                    aria-label={curPassVisible ? "Hide password" : "Show password"}
                  >
                    {curPassVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={newPassVisible ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setNewPassVisible((v) => !v)}
                    aria-label={newPassVisible ? "Hide password" : "Show password"}
                  >
                    {newPassVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="space-y-1">
                  <Progress value={passwordStrength.value} />
                  <div className="text-xs text-muted-foreground">Strength: {passwordStrength.label}</div>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="font-medium text-muted-foreground">Password requirements:</div>
                    <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {newPassword.length >= 8 ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {/[A-Z]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {/[a-z]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>One lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/\d/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {/\d/.test(newPassword) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>One number</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[!@#$%^&*]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {/[!@#$%^&*]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>One special character (!@#$%^&*)</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={confirmPassVisible ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setConfirmPassVisible((v) => !v)}
                    aria-label={confirmPassVisible ? "Hide password" : "Show password"}
                  >
                    {confirmPassVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="text-xs mt-1">
                  {confirmPassword.length > 0 && (
                    newPassword === confirmPassword ? (
                      <span className="text-green-600 dark:text-green-400">Passwords match</span>
                    ) : (
                      <span className="text-destructive">Passwords do not match</span>
                    )
                  )}
                </div>
              </div>
            </div>
            {passwordError && <ErrorText className="text-sm">{passwordError}</ErrorText>}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={handleLogoutAll} type="button">
                <LogOut className="h-4 w-4" /> Log out from all devices
              </Button>
              <Button onClick={handleUpdatePassword} loading={passwordSubmitting} disabled={!canSubmitPassword || passwordSubmitting}>
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trusted Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
              Trusted Devices
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Manage devices that can access your account and sign out lost or stolen devices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSessions && <p className="text-sm text-muted-foreground">Loading sessions…</p>}
            {sessions && sessions.filter((s) => !s.revoked).length === 0 && (
              <p className="text-sm text-muted-foreground">No trusted devices found.</p>
            )}
            {sessions && sessions.filter((s) => !s.revoked).length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="text-left">
                      <th className="py-2 pr-4">Device</th>
                      <th className="py-2 pr-4">Location</th>
                      <th className="py-2 pr-4">IP Address</th>
                      <th className="py-2 pr-4">Last Activity</th>
                      <th className="py-2 pr-0 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.filter((s) => !s.revoked).map((s) => {
                      const isCurrent = s.isCurrent
                      const DeviceIcon = s.deviceType === "mobile" || s.deviceType === "tablet" ? Smartphone : Monitor
                      return (
                        <tr key={s.token} className={isCurrent ? "bg-emerald-500/5" : undefined}>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="h-4 w-4" />
                              <div className="flex items-center gap-2">
                                {editingToken === s.token ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={nameDraft}
                                      onChange={(e) => setNameDraft(e.target.value)}
                                      className="h-8 w-40"
                                      placeholder="Device name"
                                    />
                                    <Button size="sm" onClick={saveRename} loading={renameSaving} disabled={!nameDraft.trim()}>
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={cancelRename}>
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{s.customName || s.deviceName || "Device"}</span>
                                    <button
                                      type="button"
                                      className="inline-flex items-center text-muted-foreground hover:text-foreground"
                                      onClick={() => startRename(s.token, s.customName || s.deviceName || "")}
                                      aria-label="Rename device"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="text-xs text-muted-foreground">
                                      {s.browser && s.os ? `${s.browser} on ${s.os}` : s.browser || s.os || ""}
                                    </span>
                                    {isCurrent && (
                                      <Badge variant="outline" className="border-green-500/50 text-green-600">Current device</Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            {s.city || s.country ? (
                              <span>{s.city || ""}{s.city && s.country ? ", " : ""}{s.country || ""}</span>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="underline decoration-dotted cursor-help">{maskIp(s.ip)}</span>
                                </TooltipTrigger>
                                <TooltipContent>{s.ip || ""}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            <span className="text-muted-foreground">
                              <RelativeTime date={s.lastActivityAt} />
                            </span>
                          </td>
                          <td className="py-2 pr-0 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrent}
                              onClick={() => handleLogoutSession(s.token)}
                            >
                              Remove Device
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleLogoutAllOthers} disabled={!sessions || sessions.every((s) => s.isCurrent || s.revoked)}>
                Remove All Devices (except current)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Delete Account</CardTitle>
            <CardDescription className="text-destructive-foreground">
              This action is permanent and cannot be undone. All your data will be deleted.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete My Account</Button>
          </CardContent>
        </Card>


        {/* Privacy Settings Section */}
        <div className="space-y-6">
          {/* Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500" />
                </div>
                Verification
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Verified accounts help prevent impersonation for public figures, brands, and organizations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {user ? (
                    <>
                      <p>
                        Eligibility: {user.followers.length.toLocaleString()} followers. Minimum required: 10,000.
                      </p>
                      <p>Have your legal name and documents ready.</p>
                    </>
                  ) : (
                    <p>Sign in to request verification.</p>
                  )}
                </div>
                <Button
                  onClick={() => setIsVerifOpen(true)}
                  disabled={!user || user.followers.length < 10000}
                >
                  Request Verification
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">Privacy Settings</h2>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">Control who can see your information and content</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Profile Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  </div>
                  Profile Privacy
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Choose who can see different parts of your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your profile information</p>
                  <RadioGroup.Root
                    value={privacySettings.profile}
                    onValueChange={(val) => setPrivacySettings({ ...privacySettings, profile: val as any })}
                    className="grid grid-cols-1 gap-2"
                  >
                    {[
                      {
                        value: "public",
                        label: "Public",
                        description: "Anyone can view your profile and content appears in search and explore.",
                        Icon: Globe,
                      },
                      {
                        value: "followers-only",
                        label: "Friends Only",
                        description: "Only mutual followers can see your full profile.",
                        Icon: Users,
                      },
                      {
                        value: "private",
                        label: "Private",
                        description: "Approve follower requests; only approved followers can see your content.",
                        Icon: Lock,
                      },
                    ].map((opt) => (
                      <RadioGroup.Item key={opt.value} value={opt.value} asChild>
                        <button
                          type="button"
                          className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30 data-[state=checked]:border-primary focus:outline-none"
                          aria-label={opt.label}
                        >
                          <div className="mt-0.5">
                            <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-medium">
                              <opt.Icon className="h-4 w-4" />
                              {opt.label}
                            </div>
                            <p className="text-sm text-muted-foreground">{opt.description}</p>
                          </div>
                        </button>
                      </RadioGroup.Item>
                    ))}
                  </RadioGroup.Root>
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your email address</p>
                  <PrivacySelector
                    value={privacySettings.email}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, email: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your location</p>
                  <PrivacySelector
                    value={privacySettings.location}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, location: value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                  </div>
                  Content Privacy
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Control who can see your posts, pets, and lists</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label>Posts</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your posts</p>
                  <PrivacySelector
                    value={privacySettings.posts}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, posts: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pets</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your pets</p>
                  <PrivacySelector
                    value={privacySettings.pets}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, pets: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Followers List</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your followers</p>
                  <PrivacySelector
                    value={privacySettings.followers}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, followers: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Following List</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see who you follow</p>
                  <PrivacySelector
                    value={privacySettings.following}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, following: value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                  </div>
                  Profile Sections
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Choose who can see profile basics, statistics, friends, pets tab, and activity logs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label>Profile Basics</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Controls visibility of your avatar, name, username, and bio on your profile header
                  </p>
                  <PrivacySelector
                    value={privacySettings.sections.basics}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, basics: value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Statistics</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Controls visibility of profile statistics like counts of pets, posts, followers, and following
                  </p>
                  <PrivacySelector
                    value={privacySettings.sections.statistics}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, statistics: value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Friends</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Controls visibility of your followers and following lists from your profile
                  </p>
                  <PrivacySelector
                    value={privacySettings.sections.friends}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, friends: value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pets Section</Label>
                  <p className="text-sm text-muted-foreground mb-2">Controls visibility of the pets tab on your profile</p>
                  <PrivacySelector
                    value={privacySettings.sections.pets}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, pets: value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Activity Logs</Label>
                  <p className="text-sm text-muted-foreground mb-2">Controls visibility of your recent activity feed on your profile</p>
                  <PrivacySelector
                    value={privacySettings.sections.activity}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, activity: value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Interactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                  </div>
                  Interactions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Control how others can interact with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Searchable</Label>
                    <p className="text-sm text-muted-foreground">Allow others to find you by searching</p>
                  </div>
                  <Switch
                    checked={privacySettings.searchable}
                    onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, searchable: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Follow Requests</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can send you follow requests</p>
                  <PrivacySelector
                    value={privacySettings.allowFollowRequests}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, allowFollowRequests: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tagging</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can tag you in posts</p>
                  <PrivacySelector
                    value={privacySettings.allowTagging}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, allowTagging: value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Message Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                  </div>
                  Message Privacy
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Keep direct messages private with end-to-end encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">End-to-end encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Only you and approved recipients can read your conversations.
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.secureMessages}
                    onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, secureMessages: checked })}
                  />
                </div>
                <div className="rounded-lg border border-dashed border-orange-500/30 bg-orange-500/10 p-3 sm:p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Encryption coverage</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
                    <li>Messages are encrypted on-device before sending.</li>
                    <li>Keys rotate automatically when devices change.</li>
                    <li>Attachments and reactions stay in the secure channel.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blocked Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                </div>
                Blocked Users
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage users you have blocked</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedUsers.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border gap-2 sm:gap-3">
                      <Link href={`/profile/${blockedUser.username}`} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                          <AvatarImage src={blockedUser.avatar || "/placeholder.svg"} alt={blockedUser.fullName} />
                          <AvatarFallback className="text-xs sm:text-sm">{blockedUser.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{blockedUser.fullName}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">@{blockedUser.username}</p>
                        </div>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(blockedUser.id)}
                        className="flex-shrink-0"
                      >
                        <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Unblock</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">No blocked users</p>
              )}
            </CardContent>
          </Card>

          {/* Expert Verification */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                  </div>
                  Expert Verification
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Become a verified expert to publish stable health articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isExpertVerified(user.id) ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">You are verified as an expert</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can publish stable revisions for health articles.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const request = getExpertVerificationRequestByUserId(user.id)
                      if (request) {
                        const statusMessages = {
                          pending: "Your verification request is pending review.",
                          approved: "Your verification request has been approved!",
                          rejected: request.reason
                            ? `Your request was rejected: ${request.reason}`
                            : "Your verification request was rejected.",
                        }
                        return (
                          <div className="space-y-2">
                            <p className="text-sm">{statusMessages[request.status]}</p>
                            {request.status === "rejected" && (
                              <Button asChild variant="outline" size="sm">
                                <Link href="/expert/verify">Submit New Request</Link>
                              </Button>
                            )}
                          </div>
                        )
                      }
                      return (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Submit your credentials to become a verified expert. Verified experts can publish stable health articles.
                          </p>
                          <Button asChild>
                            <Link href="/expert/verify">Request Expert Verification</Link>
                          </Button>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notification Settings Section */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">Notification Settings</h2>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Quick overview of your notification delivery channels and priorities.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                </div>
                Channel overview
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Adjust advanced preferences and notification types from the dedicated notifications page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationSettings ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {CHANNEL_SUMMARY_ORDER.map((channel) => {
                    const meta = CHANNEL_SUMMARY_META[channel]
                    const pref = notificationSettings.channelPreferences?.[channel]
                    const enabled = pref?.enabled ?? false
                    const frequency = pref?.frequency ?? "real-time"
                    const priority = pref?.priorityThreshold ?? "normal"
                    const categories = pref?.categories ?? []

                    return (
                      <div key={channel} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <meta.icon className="h-4 w-4" />
                            <span className="font-medium text-sm">{meta.label}</span>
                          </div>
                          <Badge variant={enabled ? "secondary" : "outline"}>{enabled ? "Enabled" : "Muted"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span className="rounded bg-muted px-2 py-1">Freq: {frequency.replace("-", " ")}</span>
                          <span className="rounded bg-muted px-2 py-1">Priority ≥ {priority}</span>
                          <span className="rounded bg-muted px-2 py-1">
                            {categories.length > 0
                              ? `Categories: ${categories.join(", ")}`
                              : "All categories"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading notification preferences…</p>
              )}

              <div className="flex justify-end">
                <Button asChild>
                  <Link href="/settings/notifications">Manage detailed preferences</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content Moderation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                </div>
                Content Moderation
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Control how flagged content is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <BlurToggle />
            </CardContent>
          </Card>

          {/* Integrations Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Webhook className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                </div>
                Integrations
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage webhooks and API keys for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button asChild>
                  <Link href="/settings/integrations">Manage Integrations</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button variant="outline" onClick={() => router.back()} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Email Change Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="new-email">New email address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="name@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your password to confirm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={sendVerification} onCheckedChange={(v) => setSendVerification(Boolean(v))} />
              <span>Send verification email to new address</span>
            </label>
            {emailError && <ErrorText className="text-sm">{emailError}</ErrorText>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={emailSubmitting}>Cancel</Button>
            <Button onClick={handleEmailChange} loading={emailSubmitting} disabled={emailSubmitting}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={isVerifOpen} onOpenChange={setIsVerifOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="verif-name">Full legal name</Label>
              <Input id="verif-name" value={verifName} onChange={(e) => setVerifName(e.target.value)} placeholder="As it appears on your ID" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="verif-reason">Reason for verification</Label>
              <Textarea id="verif-reason" value={verifReason} onChange={(e) => setVerifReason(e.target.value.slice(0, 500))} placeholder="Explain why this account should be verified (max 500 chars)" rows={4} />
              <p className="text-xs text-muted-foreground">{verifReason.length}/500</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="id-front">Government ID (front)</Label>
                <Input id="id-front" type="file" accept="image/*" onChange={(e) => setIdFront(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="id-back">Government ID (back)</Label>
                <Input id="id-back" type="file" accept="image/*" onChange={(e) => setIdBack(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notability">Proof of notability (news, social links, achievements)</Label>
              <Input id="notability" type="file" multiple onChange={(e) => setProofFiles(Array.from(e.target.files || []))} />
              <p className="text-xs text-muted-foreground">You can also include links within your reason above.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="biz-docs">Business documents (optional)</Label>
              <Input id="biz-docs" type="file" multiple onChange={(e) => setBizDocs(Array.from(e.target.files || []))} />
              <p className="text-xs text-muted-foreground">Only if this account represents a brand or organization (e.g., registration, tax ID).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifOpen(false)} disabled={isSubmittingVerif}>Cancel</Button>
            <Button
              loading={isSubmittingVerif}
              onClick={async () => {
                if (!user) return
                if (!verifName.trim() || !verifReason.trim()) {
                  setMessage({ type: 'error', text: 'Please fill out your legal name and reason.' })
                  return
                }
                if (!idFront || !idBack) {
                  setMessage({ type: 'error', text: 'Please upload front and back of your government ID.' })
                  return
                }
                setIsSubmittingVerif(true)
                try {
                  const form = new FormData()
                  form.append('userId', user.id)
                  form.append('fullName', verifName)
                  form.append('reason', verifReason)
                  form.append('idFront', idFront)
                  form.append('idBack', idBack)
                  proofFiles.forEach((f, i) => form.append('proof'+i, f))
                  bizDocs.forEach((f, i) => form.append('biz'+i, f))
                  const res = await fetch('/api/verification/request', { method: 'POST', body: form })
                  const data = await res.json()
                  if (!res.ok) {
                    setMessage({ type: 'error', text: data.error || 'Failed to submit verification request' })
                    return
                  }
                  setMessage({ type: 'success', text: 'Verification request submitted!' })
                  setIsVerifOpen(false)
                  setVerifName('')
                  setVerifReason('')
                  setIdFront(null)
                  setIdBack(null)
                  setProofFiles([])
                  setBizDocs([])
                } catch (e) {
                  setMessage({ type: 'error', text: 'Network error submitting verification request' })
                } finally {
                  setIsSubmittingVerif(false)
                }
              }}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) resetDeletionState() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Step {deleteStep} of 4</div>

            {deleteStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm">Are you sure? This will permanently remove:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>All posts, photos, and comments</li>
                  <li>All messages and conversations</li>
                  <li>All pet profiles</li>
                  <li>Your followers and following</li>
                </ul>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={deleteConfirmChecked} onCheckedChange={(v) => setDeleteConfirmChecked(Boolean(v))} />
                  <span>I understand this is permanent</span>
                </label>
              </div>
            )}

            {deleteStep === 2 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Reason for leaving</label>
                <div className="max-w-xs">
                  <Select value={deleteReason} onValueChange={setDeleteReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_useful">Not useful</SelectItem>
                      <SelectItem value="privacy">Privacy concerns</SelectItem>
                      <SelectItem value="notifications">Too many notifications</SelectItem>
                      <SelectItem value="alternative">Found alternative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {deleteReason === 'other' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="delete-other">Please specify</label>
                    <Input id="delete-other" value={deleteReasonOther} onChange={(e) => setDeleteReasonOther(e.target.value)} placeholder="Tell us more (optional)" />
                  </div>
                )}
              </div>
            )}

            {deleteStep === 3 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Enter your password to confirm</label>
                <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Password" />
              </div>
            )}

            {deleteStep === 4 && (
              <div className="space-y-3">
                <p className="text-sm">Type <span className="font-semibold">DELETE</span> to confirm permanent deletion.</p>
                <Input value={deleteTypeText} onChange={(e) => setDeleteTypeText(e.target.value.toUpperCase())} placeholder="DELETE" />
              </div>
            )}

            {deleteError && <ErrorText className="text-sm">{deleteError}</ErrorText>}
          </div>
          <DialogFooter>
            {deleteStep > 1 && (
              <Button variant="outline" onClick={() => setDeleteStep((s) => Math.max(1, s - 1))}>Back</Button>
            )}
            {deleteStep < 4 && (
              <Button onClick={() => canAdvanceDeleteStep() && setDeleteStep((s) => Math.min(4, s + 1))} disabled={!canAdvanceDeleteStep()}>
                Next
              </Button>
            )}
            {deleteStep === 4 && (
              <Button variant="destructive" onClick={handleConfirmDeletion} loading={deleting} disabled={!canAdvanceDeleteStep() || deleting}>
                Permanently Delete Account
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
