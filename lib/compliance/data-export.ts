/**
 * GDPR Data Export Functionality
 * 
 * Functions for exporting user data in compliance with GDPR Article 15
 * (Right of access by the data subject)
 */

import type { Pet, BlogPost } from "@/lib/types"
import { getPetsByOwnerId, getBlogPosts } from "@/lib/storage"

export interface UserDataExport {
  profile: {
    id: string
    username: string
    email?: string
    createdAt: string
    updatedAt: string
  }
  pets: Pet[]
  blogPosts: BlogPost[]
  preferences: {
    privacy: string
    notifications: Record<string, unknown>
  }
  metadata: {
    exportDate: string
    formatVersion: string
  }
}

/**
 * Export all user data in JSON format
 * 
 * @param userId - User ID to export data for
 * @returns JSON string of user data
 */
export async function exportUserData(userId: string): Promise<string> {
  const pets = await getPetsByOwnerId(userId)
  const blogPosts = await getBlogPosts(userId)

  // Get user from storage (you may need to adjust this based on your storage implementation)
  const users = await import("@/lib/storage").then((m) => m.getUsers())
  const user = users.find((u) => u.id === userId)

  const exportData: UserDataExport = {
    profile: {
      id: user?.id ?? userId,
      username: user?.username ?? "Unknown",
      email: user?.email,
      createdAt: user?.createdAt ?? new Date().toISOString(),
      updatedAt: user?.updatedAt ?? new Date().toISOString(),
    },
    pets: pets ?? [],
    blogPosts: blogPosts ?? [],
    preferences: {
      privacy: user?.privacy ?? "public",
      notifications: {},
    },
    metadata: {
      exportDate: new Date().toISOString(),
      formatVersion: "1.0",
    },
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download user data as JSON file
 */
export async function downloadUserData(userId: string, filename?: string): Promise<void> {
  const data = await exportUserData(userId)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename ?? `user-data-export-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

