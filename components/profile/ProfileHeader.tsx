"use client"

import Link from "next/link"
import { Camera, CheckCircle2, MapPin, Calendar, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/lib/types"
import { useMemo, useRef, useState } from "react"
import { useMediaPolicy } from "@/lib/hooks/use-media-policy"
import { getOptimizedImageUrl } from "@/lib/performance/cdn"

export interface ProfileHeaderProps {
  user: User
  isOwnProfile?: boolean
  postsCount?: number
  className?: string
  petsCount?: number
}

export default function ProfileHeader({
  user,
  isOwnProfile = false,
  postsCount = 0,
  className,
  petsCount,
}: ProfileHeaderProps): JSX.Element {
  const fileAvatarRef = useRef<HTMLInputElement | null>(null)
  const fileCoverRef = useRef<HTMLInputElement | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const { reducedQuality, minimalBlocked, allowOnce } = useMediaPolicy()

  const joinedLabel = useMemo((): string => {
    try {
      const d = new Date(user.joinedAt)
      return `Member since ${d.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`
    } catch {
      return ""
    }
  }, [user.joinedAt])

  const handlePickAvatar = (): void => {
    fileAvatarRef.current?.click()
  }

  const handlePickCover = (): void => {
    fileCoverRef.current?.click()
  }

  const upload = async (kind: 'avatar' | 'cover', file: File): Promise<void> => {
    const endpoint = kind === 'avatar'
      ? `/api/users/${user.id}/profile-photo`
      : `/api/users/${user.id}/cover-photo`
    const form = new FormData()
    form.append('photo', file)
    try {
      kind === 'avatar' ? setUploadingAvatar(true) : setUploadingCover(true)
      const res = await fetch(endpoint, { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
      // Let page-level SSE listener refresh the profile; as a fallback, optimistically no-op here
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Upload error', e)
      alert(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      kind === 'avatar' ? setUploadingAvatar(false) : setUploadingCover(false)
    }
  }

  return (
    <section className={cn("w-full", className)}>
      {/* Cover Photo */}
      <div className="relative w-full h-[220px] sm:h-[280px] md:h-[400px] bg-muted overflow-hidden group rounded-b-xl">
        {user.coverPhoto ? (
          minimalBlocked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/70 text-center">
              <div>
                <div className="mb-2 text-sm">Media blocked on cellular (Minimal)</div>
                <button
                  type="button"
                  className="rounded bg-primary px-3 py-1.5 text-primary-foreground"
                  onClick={allowOnce}
                >
                  Load image
                </button>
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reducedQuality ? getOptimizedImageUrl(user.coverPhoto, { quality: 60 }) : user.coverPhoto}
              alt={`${user.fullName} cover`}
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No cover photo</span>
          </div>
        )}

        {/* Change Cover Overlay */}
        {isOwnProfile && (
          <button
            type="button"
            onClick={handlePickCover}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Change Cover"
          >
            {uploadingCover ? (
              <span className="flex items-center gap-2 text-white text-sm sm:text-base font-medium">
                <Loader2 className="h-5 w-5 animate-spin" /> Uploading…
              </span>
            ) : (
              <span className="flex items-center gap-2 text-white text-sm sm:text-base font-medium">
                <Camera className="h-5 w-5" /> Change Cover
              </span>
            )}
          </button>
        )}
        <input
          ref={fileCoverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              void upload('cover', f)
            }
          }}
        />
      </div>

      {/* Header content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative -mt-[120px] flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          {/* Avatar */}
          <div className="relative shrink-0 group/avatar">
            <div className="relative h-[200px] w-[200px] rounded-full border-4 border-background overflow-hidden shadow-xl">
              <Avatar className="h-full w-full">
                <AvatarImage
                  src={reducedQuality && user.avatar ? getOptimizedImageUrl(user.avatar, { quality: 60 }) : (user.avatar || "/placeholder.svg")}
                  alt={user.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl">{user.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={handlePickAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                  aria-label="Change Photo"
                >
                  {uploadingAvatar ? (
                    <span className="flex items-center gap-2 text-white text-sm sm:text-base font-medium">
                      <Loader2 className="h-5 w-5 animate-spin" /> Uploading…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-white text-sm sm:text-base font-medium">
                      <Camera className="h-5 w-5" /> Change Photo
                    </span>
                  )}
                </button>
              )}
              <input
                ref={fileAvatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    void upload('avatar', f)
                  }
                }}
              />
            </div>
          </div>

          {/* Textual info and counts */}
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Name and metadata */}
            <div className="col-span-2 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold truncate flex items-center gap-2">
                <span className="truncate">{user.fullName}</span>
                {typeof petsCount === 'number' && (
                  <span className="text-xs sm:text-sm font-medium rounded-full bg-primary/10 text-primary px-2 py-0.5 whitespace-nowrap">
                    {petsCount} {petsCount === 1 ? 'pet' : 'pets'}
                  </span>
                )}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                <span className="truncate text-base sm:text-lg">@{user.username}</span>
                {user.badge === "verified" && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500" aria-label="Verified" />
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {user.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {user.location}
                  </span>
                )}
                {user.joinedAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> {joinedLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Counts */}
            <div className="col-span-1 grid grid-cols-3 gap-2 md:gap-4 h-fit md:justify-end">
              <Link href={`/user/${user.username}/posts`} className="group rounded-lg p-2 hover:bg-accent transition-colors text-center">
                <div className="text-xl font-semibold group-hover:text-primary">{postsCount}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </Link>
              <Link href={`/user/${user.username}/followers`} className="group rounded-lg p-2 hover:bg-accent transition-colors text-center">
                <div className="text-xl font-semibold group-hover:text-primary">{user.followers?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </Link>
              <Link href={`/user/${user.username}/following`} className="group rounded-lg p-2 hover:bg-accent transition-colors text-center">
                <div className="text-xl font-semibold group-hover:text-primary">{user.following?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
