/**
 * Table-driven tests for permission policy system
 * 
 * Tests cover all role/action pairs with explicit expectations.
 * Each test case documents the expected behavior for a specific role/action combination.
 */

import {
  isExpert,
  canCreateWiki,
  canEditWiki,
  canPublishHealth,
  canProtect,
  canPublishBlog,
  canPromoteBlog,
  canVerifyWikiRevision,
  hasPermission,
  getPermissionResult,
  type PermissionAction,
} from "../policy"
import type { User, WikiArticle, BlogPost } from "../types"

// Test user fixtures
const createUser = (overrides: Partial<User>): User => ({
  id: "1",
  email: "test@example.com",
  username: "testuser",
  fullName: "Test User",
  joinedAt: new Date().toISOString(),
  followers: [],
  following: [],
  ...overrides,
})

const regularUser = createUser({ role: "user" })
const adminUser = createUser({ role: "admin" })
const moderatorUser = createUser({ role: "moderator" })
const vetUser = createUser({ role: "user", badge: "vet" })
const verifiedUser = createUser({ role: "user", badge: "verified" })
const proUser = createUser({ role: "user", badge: "pro" })

// Test resource fixtures
const createWikiArticle = (overrides: Partial<WikiArticle>): WikiArticle => ({
  id: "wiki-1",
  title: "Test Article",
  slug: "test-article",
  category: "care",
  content: "Test content",
  authorId: "1",
  views: 0,
  likes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

const healthWikiArticle = createWikiArticle({ category: "health" })
const careWikiArticle = createWikiArticle({ category: "care" })

const createBlogPost = (overrides: Partial<BlogPost>): BlogPost => ({
  id: "blog-1",
  petId: "pet-1",
  authorId: "1",
  title: "Test Post",
  content: "Test content",
  tags: [],
  categories: [],
  likes: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe("isExpert", () => {
  const testCases = [
    {
      name: "user with vet badge should be expert",
      user: vetUser,
      expected: true,
    },
    {
      name: "regular user should not be expert",
      user: regularUser,
      expected: false,
    },
    {
      name: "user with verified badge should not be expert",
      user: verifiedUser,
      expected: false,
    },
    {
      name: "user with pro badge should not be expert",
      user: proUser,
      expected: false,
    },
    {
      name: "admin user should not be expert (unless vet badge)",
      user: adminUser,
      expected: false,
    },
    {
      name: "moderator user should not be expert (unless vet badge)",
      user: moderatorUser,
      expected: false,
    },
    {
      name: "null user should not be expert",
      user: null,
      expected: false,
    },
    {
      name: "undefined user should not be expert",
      user: undefined,
      expected: false,
    },
  ]

  test.each(testCases)("$name", ({ user, expected }) => {
    expect(isExpert(user)).toBe(expected)
  })
})

describe("canCreateWiki", () => {
  const testCases = [
    // Health category tests
    {
      name: "vet user can create health wiki",
      user: vetUser,
      category: "health",
      expected: true,
    },
    {
      name: "regular user cannot create health wiki",
      user: regularUser,
      category: "health",
      expected: false,
    },
    {
      name: "admin user cannot create health wiki (not expert)",
      user: adminUser,
      category: "health",
      expected: false,
    },
    {
      name: "moderator user cannot create health wiki (not expert)",
      user: moderatorUser,
      category: "health",
      expected: false,
    },
    {
      name: "null user cannot create health wiki",
      user: null,
      category: "health",
      expected: false,
    },

    // Non-health category tests
    {
      name: "regular user can create care wiki",
      user: regularUser,
      category: "care",
      expected: true,
    },
    {
      name: "admin user can create care wiki",
      user: adminUser,
      category: "care",
      expected: true,
    },
    {
      name: "moderator user can create care wiki",
      user: moderatorUser,
      category: "care",
      expected: true,
    },
    {
      name: "vet user can create care wiki",
      user: vetUser,
      category: "care",
      expected: true,
    },
    {
      name: "regular user can create training wiki",
      user: regularUser,
      category: "training",
      expected: true,
    },
    {
      name: "regular user can create nutrition wiki",
      user: regularUser,
      category: "nutrition",
      expected: true,
    },
    {
      name: "null user cannot create wiki (any category)",
      user: null,
      category: "care",
      expected: false,
    },
    {
      name: "regular user can create wiki with no category specified",
      user: regularUser,
      category: undefined,
      expected: true,
    },
  ]

  test.each(testCases)("$name", ({ user, category, expected }) => {
    expect(canCreateWiki(user, category)).toBe(expected)
  })
})

describe("canEditWiki", () => {
  const testCases = [
    // Owner tests
    {
      name: "user can edit own wiki article",
      user: regularUser,
      article: createWikiArticle({ authorId: regularUser.id }),
      expected: true,
    },
    {
      name: "user cannot edit another user's wiki article",
      user: regularUser,
      article: createWikiArticle({ authorId: "other-user" }),
      expected: false,
    },

    // Admin/Moderator tests
    {
      name: "admin can edit any wiki article",
      user: adminUser,
      article: createWikiArticle({ authorId: "other-user" }),
      expected: true,
    },
    {
      name: "moderator can edit any wiki article",
      user: moderatorUser,
      article: createWikiArticle({ authorId: "other-user" }),
      expected: true,
    },
    {
      name: "admin can edit own wiki article",
      user: adminUser,
      article: createWikiArticle({ authorId: adminUser.id }),
      expected: true,
    },

    // Edge cases
    {
      name: "null user cannot edit wiki",
      user: null,
      article: createWikiArticle({ authorId: "1" }),
      expected: false,
    },
    {
      name: "user cannot edit null wiki",
      user: regularUser,
      article: null,
      expected: false,
    },
    {
      name: "null user cannot edit null wiki",
      user: null,
      article: null,
      expected: false,
    },
  ]

  test.each(testCases)("$name", ({ user, article, expected }) => {
    expect(canEditWiki(user, article)).toBe(expected)
  })
})

describe("canPublishHealth", () => {
  const testCases = [
    {
      name: "vet user can publish health content",
      user: vetUser,
      expected: true,
    },
    {
      name: "regular user cannot publish health content",
      user: regularUser,
      expected: false,
    },
    {
      name: "admin user cannot publish health content (not expert)",
      user: adminUser,
      expected: false,
    },
    {
      name: "moderator user cannot publish health content (not expert)",
      user: moderatorUser,
      expected: false,
    },
    {
      name: "verified user cannot publish health content (not expert)",
      user: verifiedUser,
      expected: false,
    },
    {
      name: "null user cannot publish health content",
      user: null,
      expected: false,
    },
  ]

  test.each(testCases)("$name", ({ user, expected }) => {
    expect(canPublishHealth(user)).toBe(expected)
  })
})

describe("canProtect", () => {
  const testCases = [
    {
      name: "admin user can protect content",
      user: adminUser,
      expected: true,
    },
    {
      name: "moderator user can protect content",
      user: moderatorUser,
      expected: true,
    },
    {
      name: "regular user cannot protect content",
      user: regularUser,
      expected: false,
    },
    {
      name: "vet user cannot protect content (unless also admin/moderator)",
      user: vetUser,
      expected: false,
    },
    {
      name: "verified user cannot protect content",
      user: verifiedUser,
      expected: false,
    },
    {
      name: "null user cannot protect content",
      user: null,
      expected: false,
    },
  ]

  test.each(testCases)("$name", ({ user, expected }) => {
    expect(canProtect(user)).toBe(expected)
  })
})

describe("canPublishBlog", () => {
  const testCases = [
    // Owner tests
    {
      name: "user can publish own blog post",
      user: regularUser,
      post: createBlogPost({ authorId: regularUser.id }),
      expected: true,
    },
    {
      name: "user cannot publish another user's blog post",
      user: regularUser,
      post: createBlogPost({ authorId: "other-user" }),
      expected: false,
    },

    // Admin/Moderator tests (still must own the post)
    {
      name: "admin cannot publish another user's blog post",
      user: adminUser,
      post: createBlogPost({ authorId: "other-user" }),
      expected: false,
    },
    {
      name: "admin can publish own blog post",
      user: adminUser,
      post: createBlogPost({ authorId: adminUser.id }),
      expected: true,
    },
    {
      name: "moderator cannot publish another user's blog post",
      user: moderatorUser,
      post: createBlogPost({ authorId: "other-user" }),
      expected: false,
    },

    // Edge cases
    {
      name: "null user cannot publish blog",
      user: null,
      post: createBlogPost({ authorId: "1" }),
      expected: false,
    },
    {
      name: "user cannot publish null blog",
      user: regularUser,
      post: null,
      expected: false,
    },
    {
      name: "null user cannot publish null blog",
      user: null,
      post: null,
      expected: false,
    },
  ]

  test.each(testCases)("$name", ({ user, post, expected }) => {
    expect(canPublishBlog(user, post)).toBe(expected)
  })
})

describe("canPromoteBlog", () => {
  const testCases = [
    {
      name: "admin user can promote blog posts",
      user: adminUser,
      expected: true,
    },
    {
      name: "moderator user can promote blog posts",
      user: moderatorUser,
      expected: true,
    },
    {
      name: "regular user cannot promote blog posts",
      user: regularUser,
      expected: false,
    },
    {
      name: "vet user cannot promote blog posts (unless also admin/moderator)",
      user: vetUser,
      expected: false,
    },
    {
      name: "verified user cannot promote blog posts",
      user: verifiedUser,
      expected: false,
    },
    {
      name: "null user cannot promote blog posts",
      user: null,
      expected: false,
    },
  ]

  test.each(testCases)("$name", ({ user, expected }) => {
    expect(canPromoteBlog(user)).toBe(expected)
  })
})

describe("canVerifyWikiRevision", () => {
  const testCases = [
    // Health category tests
    {
      name: "vet user can verify health wiki revision",
      user: vetUser,
      category: "health",
      expected: true,
    },
    {
      name: "regular user cannot verify health wiki revision",
      user: regularUser,
      category: "health",
      expected: false,
    },
    {
      name: "admin user cannot verify health wiki revision (not expert)",
      user: adminUser,
      category: "health",
      expected: false,
    },
    {
      name: "moderator user cannot verify health wiki revision (not expert)",
      user: moderatorUser,
      category: "health",
      expected: false,
    },

    // Non-health category tests
    {
      name: "vet user cannot verify non-health wiki revision",
      user: vetUser,
      category: "care",
      expected: false,
    },
    {
      name: "vet user cannot verify training wiki revision",
      user: vetUser,
      category: "training",
      expected: false,
    },
    {
      name: "regular user cannot verify any wiki revision",
      user: regularUser,
      category: "care",
      expected: false,
    },
    {
      name: "null user cannot verify wiki revision",
      user: null,
      category: "health",
      expected: false,
    },
    {
      name: "vet user cannot verify wiki revision with no category",
      user: vetUser,
      category: undefined,
      expected: false,
    },
  ]

  test.each(testCases)("$name", ({ user, category, expected }) => {
    expect(canVerifyWikiRevision(user, category)).toBe(expected)
  })
})

describe("hasPermission", () => {
  const testCases: Array<{
    name: string
    action: PermissionAction
    user: User | null
    resource?: unknown
    expected: boolean
  }> = [
    // create_wiki
    {
      name: "regular user can create care wiki via hasPermission",
      action: "create_wiki",
      user: regularUser,
      resource: { category: "care" },
      expected: true,
    },
    {
      name: "regular user cannot create health wiki via hasPermission",
      action: "create_wiki",
      user: regularUser,
      resource: { category: "health" },
      expected: false,
    },
    {
      name: "vet user can create health wiki via hasPermission",
      action: "create_wiki",
      user: vetUser,
      resource: { category: "health" },
      expected: true,
    },

    // edit_wiki
    {
      name: "user can edit own wiki via hasPermission",
      action: "edit_wiki",
      user: regularUser,
      resource: createWikiArticle({ authorId: regularUser.id }),
      expected: true,
    },
    {
      name: "admin can edit any wiki via hasPermission",
      action: "edit_wiki",
      user: adminUser,
      resource: createWikiArticle({ authorId: "other-user" }),
      expected: true,
    },

    // publish_health
    {
      name: "vet user can publish health via hasPermission",
      action: "publish_health",
      user: vetUser,
      expected: true,
    },
    {
      name: "regular user cannot publish health via hasPermission",
      action: "publish_health",
      user: regularUser,
      expected: false,
    },

    // protect_content
    {
      name: "admin can protect content via hasPermission",
      action: "protect_content",
      user: adminUser,
      expected: true,
    },
    {
      name: "regular user cannot protect content via hasPermission",
      action: "protect_content",
      user: regularUser,
      expected: false,
    },

    // publish_blog
    {
      name: "user can publish own blog via hasPermission",
      action: "publish_blog",
      user: regularUser,
      resource: createBlogPost({ authorId: regularUser.id }),
      expected: true,
    },
    {
      name: "user cannot publish another's blog via hasPermission",
      action: "publish_blog",
      user: regularUser,
      resource: createBlogPost({ authorId: "other-user" }),
      expected: false,
    },

    // promote_blog
    {
      name: "admin can promote blog via hasPermission",
      action: "promote_blog",
      user: adminUser,
      expected: true,
    },
    {
      name: "regular user cannot promote blog via hasPermission",
      action: "promote_blog",
      user: regularUser,
      expected: false,
    },

    // verify_wiki_revision
    {
      name: "vet user can verify health revision via hasPermission",
      action: "verify_wiki_revision",
      user: vetUser,
      resource: { category: "health" },
      expected: true,
    },
    {
      name: "regular user cannot verify health revision via hasPermission",
      action: "verify_wiki_revision",
      user: regularUser,
      resource: { category: "health" },
      expected: false,
    },

    // Unknown action (deny by default)
    {
      name: "unknown action defaults to deny",
      action: "unknown_action" as PermissionAction,
      user: adminUser,
      expected: false,
    },
  ]

  test.each(testCases)("$name", ({ action, user, resource, expected }) => {
    expect(
      hasPermission(action, {
        user,
        resource: resource as { type: string; [key: string]: unknown } | undefined,
      })
    ).toBe(expected)
  })
})

describe("getPermissionResult", () => {
  describe("create_wiki", () => {
    const testCases = [
      {
        name: "returns allowed true for regular user creating care wiki",
        action: "create_wiki" as PermissionAction,
        user: regularUser,
        resource: { category: "care" },
        expectedAllowed: true,
      },
      {
        name: "returns allowed false with reason for regular user creating health wiki",
        action: "create_wiki" as PermissionAction,
        user: regularUser,
        resource: { category: "health" },
        expectedAllowed: false,
        expectedReason: "Only verified experts can create health-related wiki articles",
      },
      {
        name: "returns allowed false with reason for null user",
        action: "create_wiki" as PermissionAction,
        user: null,
        resource: { category: "care" },
        expectedAllowed: false,
        expectedReason: "You must be logged in to perform this action",
      },
    ]

    test.each(testCases)(
      "$name",
      ({ action, user, resource, expectedAllowed, expectedReason }) => {
        const result = getPermissionResult(action, {
          user,
          resource: resource as { type: string; [key: string]: unknown },
        })
        expect(result.allowed).toBe(expectedAllowed)
        if (expectedReason) {
          expect(result.reason).toBe(expectedReason)
        }
      }
    )
  })

  describe("error messages", () => {
    const testCases = [
      {
        name: "edit_wiki returns appropriate error for non-owner",
        action: "edit_wiki" as PermissionAction,
        user: regularUser,
        resource: createWikiArticle({ authorId: "other-user" }),
        expectedReason: "You can only edit your own wiki articles",
      },
      {
        name: "publish_health returns appropriate error for non-expert",
        action: "publish_health" as PermissionAction,
        user: regularUser,
        expectedReason: "Only verified experts can publish health content",
      },
      {
        name: "protect_content returns appropriate error for non-admin",
        action: "protect_content" as PermissionAction,
        user: regularUser,
        expectedReason: "Only administrators can protect content",
      },
      {
        name: "promote_blog returns appropriate error for non-admin",
        action: "promote_blog" as PermissionAction,
        user: regularUser,
        expectedReason: "Only administrators can promote blog posts",
      },
    ]

    test.each(testCases)("$name", ({ action, user, resource, expectedReason }) => {
      const result = getPermissionResult(action, {
        user,
        resource: resource as { type: string; [key: string]: unknown } | undefined,
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe(expectedReason)
    })
  })
})

