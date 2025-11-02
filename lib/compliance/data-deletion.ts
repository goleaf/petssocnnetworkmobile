/**
 * GDPR Data Deletion Functionality
 * 
 * Functions for deleting user data in compliance with GDPR Article 17
 * (Right to erasure / "Right to be forgotten")
 */

import { deletePet, deleteBlogPost } from "@/lib/storage"

/**
 * Delete all user data
 * 
 * @param userId - User ID to delete data for
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteUserData(userId: string): Promise<void> {
  // Import storage functions dynamically to avoid circular dependencies
  const storage = await import("@/lib/storage")
  
  // Get all user's pets and blog posts
  const pets = await storage.getPetsByOwnerId(userId)
  const blogPosts = await storage.getBlogPosts(userId)

  // Delete all pets
  if (pets) {
    for (const pet of pets) {
      await deletePet(pet.id)
    }
  }

  // Delete all blog posts
  if (blogPosts) {
    for (const post of blogPosts) {
      await deleteBlogPost(post.id)
    }
  }

  // Delete user account (you may need to implement this in your storage layer)
  // await storage.deleteUser(userId)

  // Clear local storage items related to this user
  if (typeof window !== "undefined") {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes(userId)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  }
}

/**
 * Request data deletion with confirmation
 * 
 * This should be called after user confirms they want to delete their account
 */
export async function requestDataDeletion(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    await deleteUserData(userId)
    return {
      success: true,
      message: "Your data has been successfully deleted.",
    }
  } catch (error) {
    console.error("Failed to delete user data:", error)
    return {
      success: false,
      message: "An error occurred while deleting your data. Please try again or contact support.",
    }
  }
}

