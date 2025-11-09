/**
 * Job processors for different job types
 */

import { prisma } from "@/lib/prisma"
import type {
  LinkCheckJobPayload,
  LinkCheckJobResult,
  NotifyUserJobPayload,
  NotifyUserJobResult,
  RebuildSearchIndexJobPayload,
  RebuildSearchIndexJobResult,
  TranscodeVideoJobPayload,
  TranscodeVideoJobResult,
} from "@/lib/types/queue"
import { updateJob } from "./queue"

/**
 * Process link check job
 */
export async function processLinkCheck(
  jobId: string,
  payload: LinkCheckJobPayload
): Promise<LinkCheckJobResult> {
  const { url } = payload

  try {
    await updateJob(jobId, {
      status: "processing",
      progress: 10,
      progressMessage: "Validating URL format...",
      startedAt: new Date(),
    })

    // Validate URL format
    const urlObj = new URL(url)

    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Invalid protocol. Only http and https are allowed.")
    }

    await updateJob(jobId, {
      progress: 50,
      progressMessage: "Checking URL accessibility...",
    })

    // Perform HEAD request to check if URL is accessible
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "PetSocialNetwork/1.0",
        },
      })

      clearTimeout(timeoutId)

      const statusCode = response.status
      const isValid = statusCode >= 200 && statusCode < 400

      const result: LinkCheckJobResult = {
        url,
        isValid,
        statusCode,
        error: isValid ? undefined : `HTTP ${statusCode}`,
        checkedAt: new Date().toISOString(),
      }

      await updateJob(jobId, {
        progress: 100,
        progressMessage: isValid ? "Link is valid" : "Link check completed",
        status: "completed",
        result: result as unknown as Record<string, unknown>,
        completedAt: new Date(),
      })

      return result
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)

      let errorMessage = "Unknown error"
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        errorMessage = "Request timeout"
      } else if (fetchError instanceof Error) {
        errorMessage = fetchError.message
      }

      const result: LinkCheckJobResult = {
        url,
        isValid: false,
        error: errorMessage,
        checkedAt: new Date().toISOString(),
      }

      await updateJob(jobId, {
        progress: 100,
        progressMessage: "Link check failed",
        status: "completed",
        result: result as unknown as Record<string, unknown>,
        completedAt: new Date(),
      })

      return result
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Invalid URL format"

    const result: LinkCheckJobResult = {
      url,
      isValid: false,
      error: errorMessage,
      checkedAt: new Date().toISOString(),
    }

    await updateJob(jobId, {
      progress: 100,
      status: "completed",
      result: result as Record<string, unknown>,
      error: errorMessage,
      completedAt: new Date(),
    })

    return result
  }
}

/**
 * Process notify user job
 */
export async function processNotifyUser(
  jobId: string,
  payload: NotifyUserJobPayload
): Promise<NotifyUserJobResult> {
  const { userId, templateId, data } = payload

  try {
    await updateJob(jobId, {
      status: "processing",
      progress: 10,
      progressMessage: "Preparing notification...",
      startedAt: new Date(),
    })

    // Verify user exists
    // Note: Since we're not using user authentication, we'll skip user verification
    // In a real system, you would fetch user here

    await updateJob(jobId, {
      progress: 50,
      progressMessage: `Sending notification (template: ${templateId})...`,
    })

    // TODO: Implement actual notification sending logic
    // For now, we'll simulate it
    await new Promise((resolve) => setTimeout(resolve, 500))

    const result: NotifyUserJobResult = {
      success: true,
      message: `Notification sent successfully using template ${templateId}`,
      sentAt: new Date().toISOString(),
    }

    await updateJob(jobId, {
      progress: 100,
      progressMessage: "Notification sent",
      status: "completed",
      result: result as Record<string, unknown>,
      completedAt: new Date(),
    })

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send notification"

    const result: NotifyUserJobResult = {
      success: false,
      message: errorMessage,
      sentAt: new Date().toISOString(),
    }

    await updateJob(jobId, {
      progress: 100,
      status: "completed",
      result: result as Record<string, unknown>,
      error: errorMessage,
      completedAt: new Date(),
    })

    return result
  }
}

/**
 * Process rebuild search index job
 */
export async function processRebuildSearchIndex(
  jobId: string,
  payload: RebuildSearchIndexJobPayload
): Promise<RebuildSearchIndexJobResult> {
  const { type = "all" } = payload

  const startTime = Date.now()
  let indexed = 0
  let errors = 0

  try {
    await updateJob(jobId, {
      status: "processing",
      progress: 5,
      progressMessage: "Starting search index rebuild...",
      startedAt: new Date(),
    })

    // Rebuild article search index
    if (type === "articles" || type === "all") {
      await updateJob(jobId, {
        progress: 20,
        progressMessage: "Rebuilding article search index...",
      })

      try {
        // Get all approved revisions and populate article search index
        const articles = await prisma.article.findMany({
          include: {
            revisions: {
              where: {
                approvedAt: {
                  not: null,
                },
              },
              orderBy: {
                rev: "desc",
              },
              take: 1,
            },
          },
        })

        for (let i = 0; i < articles.length; i++) {
          const article = articles[i]
          const latestRevision = article.revisions[0]

          if (latestRevision) {
            try {
              // Extract text content from JSON
              const content = JSON.stringify(latestRevision.contentJSON)
              const title = article.title

              // Use raw SQL to update tsvector
              await prisma.$executeRaw`
                INSERT INTO article_search_index (article_id, content)
                VALUES (${article.id}, to_tsvector('english', ${title} || ' ' || ${content}))
                ON CONFLICT (article_id) 
                DO UPDATE SET content = to_tsvector('english', ${title} || ' ' || ${content})
              `

              indexed++

              const progress = 20 + Math.floor((i / articles.length) * 40)
              await updateJob(jobId, {
                progress,
                progressMessage: `Indexed ${indexed} articles...`,
              })
            } catch (error) {
              errors++
              console.error(`Error indexing article ${article.id}:`, error)
            }
          }
        }
      } catch (error) {
        errors++
        console.error("Error rebuilding article index:", error)
      }
    }

    // Rebuild blog post search index
    if (type === "blogPosts" || type === "all") {
      await updateJob(jobId, {
        progress: 60,
        progressMessage: "Rebuilding blog post search index...",
      })

      try {
        const blogPosts = await prisma.blogPost.findMany({
          where: {
            isDraft: false,
          },
        })

        for (let i = 0; i < blogPosts.length; i++) {
          const post = blogPosts[i]
          try {
            const searchableContent = `${post.title} ${post.content} ${post.tags.join(" ")}`

            // Use raw SQL to update tsvector
            await prisma.$executeRaw`
              INSERT INTO blog_post_search_index (post_id, content)
              VALUES (${post.id}, to_tsvector('english', ${searchableContent}))
              ON CONFLICT (post_id) 
              DO UPDATE SET content = to_tsvector('english', ${searchableContent})
            `

            indexed++

            const progress = 60 + Math.floor((i / blogPosts.length) * 35)
            await updateJob(jobId, {
              progress,
              progressMessage: `Indexed ${indexed} items...`,
            })
          } catch (error) {
            errors++
            console.error(`Error indexing blog post ${post.id}:`, error)
          }
        }
      } catch (error) {
        errors++
        console.error("Error rebuilding blog post index:", error)
      }
    }

    const duration = Date.now() - startTime
    const result: RebuildSearchIndexJobResult = {
      success: errors === 0,
      indexed,
      errors,
      duration,
    }

    await updateJob(jobId, {
      progress: 100,
      progressMessage: `Completed: ${indexed} indexed, ${errors} errors`,
      status: "completed",
      result: result as Record<string, unknown>,
      completedAt: new Date(),
    })

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to rebuild search index"
    const duration = Date.now() - startTime

    const result: RebuildSearchIndexJobResult = {
      success: false,
      indexed,
      errors: errors + 1,
      duration,
    }

    await updateJob(jobId, {
      progress: 100,
      status: "completed",
      result: result as Record<string, unknown>,
      error: errorMessage,
      completedAt: new Date(),
    })

    return result
  }
}

/**
 * Stub processor: Transcode video job
 * In a real system, invoke a transcoder (FFmpeg/Lambda/MediaConvert), then update the URL.
 */
export async function processTranscodeVideo(
  jobId: string,
  payload: TranscodeVideoJobPayload
): Promise<TranscodeVideoJobResult> {
  const start = Date.now()
  await updateJob(jobId, {
    status: "processing",
    progress: 10,
    progressMessage: `Queuing transcode (${payload.preset})...`,
    startedAt: new Date(),
  })

  // Simulate work
  await new Promise((r) => setTimeout(r, 300))

  const result: TranscodeVideoJobResult = {
    success: true,
    preset: payload.preset,
    outputUrl: payload.fileUrl, // In a real system this points to the transcoded asset
    durationMs: Date.now() - start,
  }

  await updateJob(jobId, {
    progress: 100,
    progressMessage: "Transcode complete (stub)",
    status: "completed",
    result: result as unknown as Record<string, unknown>,
    completedAt: new Date(),
  })

  return result
}
