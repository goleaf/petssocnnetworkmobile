/**
 * Tests for Feature Flags functionality
 * 
 * Tests verify that WIKI_WRITE flag properly hides editor affordances
 */

import { describe, it, expect, beforeEach } from "@jest/globals"
import { isFlagEnabled, updateFlag, FeatureFlagsSchema, loadFlags, saveFlags } from "@/lib/flags"
import { canCreateWiki, canEditWiki } from "@/lib/policy"
import type { User, WikiArticle } from "@/lib/types"

describe("Feature Flags - WIKI_WRITE", () => {
  const mockUser: User = {
    id: "user-1",
    username: "testuser",
    email: "test@example.com",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockAdminUser: User = {
    ...mockUser,
    id: "admin-1",
    role: "admin",
  }

  const mockWikiArticle: WikiArticle = {
    id: "wiki-1",
    title: "Test Article",
    slug: "test-article",
    content: "Test content",
    authorId: "user-1",
    category: "care",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    likes: [],
  }

  beforeEach(() => {
    // Reset localStorage before each test
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
    jest.clearAllMocks()
  })

  it("should allow wiki creation when WIKI_WRITE flag is enabled", () => {
    // Enable WIKI_WRITE flag
    updateFlag("WIKI_WRITE", { enabled: true, killSwitch: false })
    
    const canCreate = canCreateWiki(mockUser, "care")
    expect(canCreate).toBe(true)
  })

  it("should prevent wiki creation when WIKI_WRITE kill switch is active", () => {
    // Enable kill switch
    updateFlag("WIKI_WRITE", { killSwitch: true })
    
    const canCreate = canCreateWiki(mockUser, "care")
    expect(canCreate).toBe(false)
  })

  it("should prevent wiki creation when WIKI_WRITE flag is disabled", () => {
    // Disable flag
    updateFlag("WIKI_WRITE", { enabled: false, killSwitch: false })
    
    const canCreate = canCreateWiki(mockUser, "care")
    expect(canCreate).toBe(false)
  })

  it("should allow admin to create wiki even when WIKI_WRITE is disabled", () => {
    // Disable flag
    updateFlag("WIKI_WRITE", { enabled: false, killSwitch: true })
    
    const canCreate = canCreateWiki(mockAdminUser, "care")
    expect(canCreate).toBe(true) // Admins bypass flag check
  })

  it("should allow wiki editing when WIKI_WRITE flag is enabled", () => {
    // Enable WIKI_WRITE flag
    updateFlag("WIKI_WRITE", { enabled: true, killSwitch: false })
    
    const canEdit = canEditWiki(mockUser, mockWikiArticle)
    expect(canEdit).toBe(true) // User owns the article
  })

  it("should prevent wiki editing when WIKI_WRITE kill switch is active", () => {
    // Enable kill switch
    updateFlag("WIKI_WRITE", { killSwitch: true })
    
    const canEdit = canEditWiki(mockUser, mockWikiArticle)
    expect(canEdit).toBe(false)
  })

  it("should prevent wiki editing when WIKI_WRITE flag is disabled", () => {
    // Disable flag
    updateFlag("WIKI_WRITE", { enabled: false, killSwitch: false })
    
    const canEdit = canEditWiki(mockUser, mockWikiArticle)
    expect(canEdit).toBe(false)
  })

  it("should allow admin to edit wiki even when WIKI_WRITE is disabled", () => {
    // Disable flag
    updateFlag("WIKI_WRITE", { enabled: false, killSwitch: true })
    
    const canEdit = canEditWiki(mockAdminUser, mockWikiArticle)
    expect(canEdit).toBe(true) // Admins bypass flag check
  })

  it("should allow moderator to edit wiki even when WIKI_WRITE is disabled", () => {
    const moderatorUser: User = {
      ...mockUser,
      role: "moderator",
    }
    
    // Disable flag
    updateFlag("WIKI_WRITE", { enabled: false, killSwitch: true })
    
    const canEdit = canEditWiki(moderatorUser, mockWikiArticle)
    expect(canEdit).toBe(true) // Moderators bypass flag check
  })

  it("should validate flag schema", () => {
    const validFlag = {
      key: "TEST_FLAG",
      name: "Test Flag",
      description: "Test description",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all" as const,
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = FeatureFlagsSchema.safeParse({
      flags: {
        TEST_FLAG: validFlag,
      },
    })

    expect(result.success).toBe(true)
  })

  it("should reject invalid flag schema", () => {
    const invalidFlag = {
      key: "TEST_FLAG",
      name: "", // Empty name should fail
      enabled: true,
    }

    const result = FeatureFlagsSchema.safeParse({
      flags: {
        TEST_FLAG: invalidFlag,
      },
    })

    expect(result.success).toBe(false)
  })
})
