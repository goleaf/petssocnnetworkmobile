"use server"

/**
 * Server Actions for Blog Management
 * 
 * Handles:
 * - Creating blog drafts
 * - Publishing blog posts with slug collision checks
 * - Tag suggestions
 * - Promoting blog sections to wiki
 */

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { BlogPost, BlogSeries, BlogSectionPromotion, MDXCallout } from "../types"
import {
  getBlogPosts,
  getBlogPostById,
  addBlogPost,
  updateBlogPost,
} from "../storage"
import { generateBlogPostSlug } from "../utils/slug"
import { getTagSuggestions } from "../utils/tags"
import { getCurrentUser } from "../auth-server"

export interface CreateBlogDraftInput {
  petId: string
  title: string
  content: string
  tags?: string[]
  categories?: string[]
  privacy?: "public" | "private" | "followers-only"
  hashtags?: string[]
  seriesId?: string
  seriesOrder?: number
  authorInfo?: {
    byline?: string
    vetBadge?: boolean
    contactLinks?: {
      email?: string
      website?: string
      social?: {
        twitter?: string
        instagram?: string
        facebook?: string
        linkedin?: string
      }
    }
    credentials?: string[]
    specialization?: string[]
  }
  mdxCallouts?: MDXCallout[]
}

export interface PublishBlogPostInput extends CreateBlogDraftInput {
  draftId?: string
}

/**
 * Create a blog draft
 * Returns the created draft post ID
 */
export async function createBlogDraft(
  input: CreateBlogDraftInput
): Promise<{ success: boolean; error?: string; postId?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    // Validate required fields
    if (!input.petId || !input.title || !input.content) {
      return { success: false, error: "Pet ID, title, and content are required" }
    }

    // Create draft post
    const now = new Date().toISOString()
    const draftPost: BlogPost = {
      id: `draft_${Date.now()}`,
      petId: input.petId,
      authorId: user.id,
      title: input.title,
      content: input.content,
      tags: input.tags || [],
      categories: input.categories || [],
      likes: [],
      createdAt: now,
      updatedAt: now,
      privacy: input.privacy || "public",
      isDraft: true,
      queueStatus: "draft",
      hashtags: input.hashtags || [],
      seriesId: input.seriesId,
      seriesOrder: input.seriesOrder,
      authorInfo: input.authorInfo,
      mdxCallouts: input.mdxCallouts,
    }

    addBlogPost(draftPost)

    revalidatePath("/blog")
    revalidatePath("/drafts")

    return { success: true, postId: draftPost.id }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to create draft" }
  }
}

/**
 * Publish a blog post
 * Generates a unique slug and handles collision detection
 */
export async function publishBlogPost(
  input: PublishBlogPostInput,
  postId?: string
): Promise<{ success: boolean; error?: string; postId?: string; slug?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    // Validate required fields
    if (!input.petId || !input.title || !input.content) {
      return { success: false, error: "Pet ID, title, and content are required" }
    }

    // Get existing slugs for collision detection
    const existingPosts = getBlogPosts()
    const existingSlugs = existingPosts
      .map((p) => p.slug)
      .filter((s): s is string => !!s)

    // Generate unique slug
    const slug = generateBlogPostSlug(input.title, existingSlugs, postId)

    const now = new Date().toISOString()

    if (postId) {
      // Update existing post
      const existingPost = getBlogPostById(postId)
      if (!existingPost) {
        return { success: false, error: "Post not found" }
      }

      if (existingPost.authorId !== user.id) {
        return { success: false, error: "Not authorized to edit this post" }
      }

      const updatedPost: BlogPost = {
        ...existingPost,
        title: input.title,
        content: input.content,
        slug,
        tags: input.tags || [],
        categories: input.categories || [],
        privacy: input.privacy || existingPost.privacy || "public",
        hashtags: input.hashtags || [],
        updatedAt: now,
        isDraft: false,
        queueStatus: "published",
        seriesId: input.seriesId,
        seriesOrder: input.seriesOrder,
        authorInfo: input.authorInfo,
        mdxCallouts: input.mdxCallouts,
      }

      updateBlogPost(updatedPost)

      revalidatePath("/blog")
      revalidatePath(`/blog/${postId}`)
      if (slug) {
        revalidatePath(`/blog/${slug}`)
      }

      return { success: true, postId: updatedPost.id, slug }
    } else {
      // Create new post
      const newPost: BlogPost = {
        id: String(Date.now()),
        petId: input.petId,
        authorId: user.id,
        title: input.title,
        content: input.content,
        slug,
        tags: input.tags || [],
        categories: input.categories || [],
        likes: [],
        createdAt: now,
        updatedAt: now,
        privacy: input.privacy || "public",
        isDraft: false,
        queueStatus: "published",
        hashtags: input.hashtags || [],
        seriesId: input.seriesId,
        seriesOrder: input.seriesOrder,
        authorInfo: input.authorInfo,
        mdxCallouts: input.mdxCallouts,
      }

      addBlogPost(newPost)

      // If this is part of a series, update the series
      if (input.seriesId) {
        const { addPostToSeries } = await import("../storage-series")
        addPostToSeries(input.seriesId, newPost.id)
      }

      revalidatePath("/blog")
      revalidatePath(`/blog/${newPost.id}`)
      if (slug) {
        revalidatePath(`/blog/${slug}`)
      }

      return { success: true, postId: newPost.id, slug }
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to publish post" }
  }
}

/**
 * Get tag suggestions based on prefix
 */
export async function getTagsSuggest(prefix: string): Promise<string[]> {
  try {
    return getTagSuggestions(prefix, 10)
  } catch (error) {
    console.error("Error getting tag suggestions:", error)
    return []
  }
}

/**
 * Promote a blog section to wiki
 * Extracts content block and creates wiki draft
 */
export async function promoteBlogSectionToWiki(
  postId: string,
  blockId: string,
  sectionContent: string,
  citations?: string[]
): Promise<{ success: boolean; error?: string; wikiArticleId?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    const post = getBlogPostById(postId)
    if (!post) {
      return { success: false, error: "Blog post not found" }
    }

    // Generate wiki slug from post title + block identifier
    const baseSlug = `${post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${blockId}`
    const wikiSlug = baseSlug.substring(0, 100)

    // Create promotion record
    const promotion: BlogSectionPromotion = {
      id: `promo_${Date.now()}`,
      postId,
      blockId,
      sectionContent,
      citations: citations || [],
      wikiSlug,
      status: "pending",
      promotedBy: user.id,
      promotedAt: new Date().toISOString(),
    }

    // Add promotion to post
    const updatedPost: BlogPost = {
      ...post,
      sectionPromotions: [...(post.sectionPromotions || []), promotion],
    }
    updateBlogPost(updatedPost)

    // Create wiki article draft
    try {
      const { addWikiArticle } = await import("../storage")
      const { generateSlug } = await import("../utils/slug")
      const { getWikiArticles } = await import("../storage")
      
      const existingArticles = getWikiArticles()
      const existingSlugs = existingArticles.map((a) => a.slug)
      const wikiSlug = generateSlug(`${post.title} ${blockId}`)
      
      // Ensure unique slug
      let finalSlug = wikiSlug
      let counter = 1
      while (existingSlugs.includes(finalSlug)) {
        finalSlug = `${wikiSlug}-${counter}`
        counter++
      }
      
      // Determine category from post categories/tags
      const categoryMap: Record<string, "care" | "health" | "training" | "nutrition" | "behavior" | "breeds"> = {
        health: "health",
        medical: "health",
        vet: "health",
        training: "training",
        behavior: "behavior",
        nutrition: "nutrition",
        diet: "nutrition",
        breed: "breeds",
      }
      
      let category: "care" | "health" | "training" | "nutrition" | "behavior" | "breeds" = "care"
      const allText = [...(post.categories || []), ...(post.tags || [])]
        .map((s) => s.toLowerCase())
        .join(" ")
      
      for (const [key, value] of Object.entries(categoryMap)) {
        if (allText.includes(key)) {
          category = value
          break
        }
      }
      
      // Create wiki article draft
      const wikiArticle = {
        id: `wiki_${Date.now()}`,
        title: blockId, // Use blockId as title, can be updated later
        slug: finalSlug,
        category,
        content: sectionContent + (citations && citations.length > 0 ? `\n\n## Citations\n\n${citations.map((c) => `- ${c}`).join("\n")}` : ""),
        authorId: user.id,
        views: 0,
        likes: [],
        tags: post.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      addWikiArticle(wikiArticle)
      
      // Update promotion with wiki article ID
      const updatedPromotion = {
        ...promotion,
        wikiArticleId: wikiArticle.id,
        status: "published" as const,
      }
      
      const finalPost: BlogPost = {
        ...post,
        sectionPromotions: post.sectionPromotions?.map((p) =>
          p.id === promotion.id ? updatedPromotion : p
        ) || [updatedPromotion],
      }
      updateBlogPost(finalPost)
      
      revalidatePath(`/blog/${postId}`)
      revalidatePath(`/wiki/${finalSlug}`)
      
      return {
        success: true,
        wikiArticleId: wikiArticle.id,
      }
    } catch (wikiError) {
      console.error("Error creating wiki article:", wikiError)
      // Still return success for promotion record
      return {
        success: true,
        wikiArticleId: undefined,
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to promote section to wiki" }
  }
}
