/**
 * Server-safe Storage Helpers
 * 
 * This module provides server-side storage functions that work without localStorage.
 * In production, these should be replaced with database queries.
 * 
 * NOTE: This is a temporary solution. In production, replace with a proper database.
 */

import type { User, WikiTranslation, WikiArticle, TranslationGlossary } from "./types"
import { mockUsers } from "./mock-data"
import {
  getWikiTranslations as getClientWikiTranslations,
  getWikiArticles as getClientWikiArticles,
  updateWikiTranslation as updateClientWikiTranslation,
  getTranslationGlossary as getClientTranslationGlossary,
  createTranslationGlossary as createClientTranslationGlossary,
  updateTranslationGlossary as updateClientTranslationGlossary,
  deleteTranslationGlossary as deleteClientTranslationGlossary,
  getTranslationGlossaryById as getClientTranslationGlossaryById,
} from "./storage"

// In-memory cache for server-side operations
// In production, this should be replaced with database queries
let serverUsersCache: User[] | null = null

/**
 * Get users from server-safe storage
 * 
 * TODO: Replace with database query in production
 */
export function getServerUsers(): User[] {
  // For now, return mock users
  // In production, query from database
  if (serverUsersCache) {
    return serverUsersCache
  }
  
  // Initialize with mock data
  // In production, this would query a database
  serverUsersCache = [...mockUsers]
  
  return serverUsersCache
}

/**
 * Get user by ID from server-safe storage
 */
export function getServerUserById(id: string): User | undefined {
  const users = getServerUsers()
  return users.find((u) => u.id === id)
}

/**
 * Get user by username from server-safe storage
 */
export function getServerUserByUsername(username: string): User | undefined {
  const users = getServerUsers()
  return users.find((u) => u.username === username)
}

/**
 * Update user in server-safe storage
 * 
 * TODO: Replace with database update in production
 */
export function updateServerUser(userId: string, updates: Partial<User>): void {
  const users = getServerUsers()
  const index = users.findIndex((u) => u.id === userId)
  
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    serverUsersCache = users
    // In production, this would update the database
  }
}

/**
 * Add user to server-safe storage
 * 
 * TODO: Replace with database insert in production
 */
export function addServerUser(user: User): void {
  const users = getServerUsers()
  users.push(user)
  serverUsersCache = users
  // In production, this would insert into database
}

/**
 * Check if email exists in server-safe storage
 */
export function serverEmailExists(email: string): boolean {
  const users = getServerUsers()
  return users.some((u) => u.email === email)
}

/**
 * Check if username exists in server-safe storage
 */
export function serverUsernameExists(username: string): boolean {
  const users = getServerUsers()
  return users.some((u) => u.username === username)
}

/**
 * Get wiki translations from storage
 * NOTE: In production, replace with database query
 */
export function getWikiTranslations(): WikiTranslation[] {
  try {
    return getClientWikiTranslations()
  } catch {
    return []
  }
}

/**
 * Get wiki translation by ID
 */
export function getWikiTranslationById(id: string): WikiTranslation | undefined {
  const translations = getWikiTranslations()
  return translations.find((t) => t.id === id)
}

/**
 * Update wiki translation
 * NOTE: In production, replace with database update
 */
export function updateWikiTranslation(id: string, updates: Partial<WikiTranslation>): void {
  try {
    updateClientWikiTranslation(id, updates)
  } catch (error) {
    console.error("Error updating wiki translation:", error)
  }
}

/**
 * Get wiki articles from storage
 * NOTE: In production, replace with database query
 */
export function getWikiArticles(): WikiArticle[] {
  try {
    const { getWikiArticles: getClientWikiArticles } = require("./storage")
    return getClientWikiArticles()
  } catch {
    return []
  }
}

/**
 * Get translation glossary from storage
 * NOTE: In production, replace with database query
 */
export function getTranslationGlossary(): TranslationGlossary[] {
  try {
    return getClientTranslationGlossary()
  } catch {
    return []
  }
}

/**
 * Get translation glossary by ID
 */
export function getTranslationGlossaryById(id: string): TranslationGlossary | undefined {
  const glossary = getTranslationGlossary()
  return glossary.find((g) => g.id === id)
}

/**
 * Create translation glossary entry
 * NOTE: In production, replace with database insert
 */
export function createTranslationGlossary(glossary: TranslationGlossary): void {
  try {
    createClientTranslationGlossary(glossary)
  } catch (error) {
    console.error("Error creating glossary entry:", error)
  }
}

/**
 * Update translation glossary entry
 * NOTE: In production, replace with database update
 */
export function updateTranslationGlossary(id: string, updates: Partial<TranslationGlossary>): void {
  try {
    updateClientTranslationGlossary(id, updates)
  } catch (error) {
    console.error("Error updating glossary entry:", error)
  }
}

/**
 * Delete translation glossary entry
 * NOTE: In production, replace with database delete
 */
export function deleteTranslationGlossary(id: string): void {
  try {
    deleteClientTranslationGlossary(id)
  } catch (error) {
    console.error("Error deleting glossary entry:", error)
  }
}

