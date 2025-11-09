"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { User, BlogPost } from "@/lib/types"
import { getUserByUsername, getBlogPosts, getPetsByOwnerId } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import ProfileHeader from "@/components/profile/ProfileHeader"

export default function ProfilePage(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [petsCount, setPetsCount] = useState<number>(0)

  useEffect(() => {
    const username = String(params.username || "")
    const u = getUserByUsername(username)
    if (!u) {
      router.push("/")
      return
    }
    setUser(u)
    const allPosts = getBlogPosts().filter((p) => p.authorId === u.id)
    setPosts(allPosts)
    try {
      setPetsCount(getPetsByOwnerId(u.id).length)
    } catch {}
  }, [params.username])

  if (!user) {
    return <div className="p-6">Loading profile…</div>
  }

  const isOwn = currentUser?.id === user.id
  const postsCount = posts.length

  return (
    <main className="flex flex-col gap-6 pb-10">
      <ProfileHeader user={user} isOwnProfile={isOwn} postsCount={postsCount} petsCount={petsCount} />
      {/* Additional profile sections can render here */}
    </main>
  )
}
