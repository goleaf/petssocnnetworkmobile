import {
  toggleWatch,
  updateBlogPost,
  updateWikiArticle,
  addComment,
  getWatchEntriesByUserId,
} from "../storage"
import { getNotificationsByUserId } from "../notifications"
import { getBlogPostById, getWikiArticles, getUserById } from "../storage"
import type { BlogPost, WikiArticle, Comment } from "../types"

describe("Watch notifications integration", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe("Blog post updates", () => {
    it("should notify watchers when a blog post is updated", () => {
      // Create a blog post
      const post: BlogPost = {
        id: "post1",
        petId: "pet1",
        authorId: "author1",
        title: "Test Post",
        content: "Original content",
        tags: [],
        categories: [],
        likes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save post (we need to mock or use actual storage)
      const posts = JSON.parse(localStorage.getItem("pet_social_blog_posts") || "[]")
      posts.push(post)
      localStorage.setItem("pet_social_blog_posts", JSON.stringify(posts))

      // Create a user for the author
      const author = {
        id: "author1",
        username: "author1",
        fullName: "Author Name",
        email: "author@test.com",
        createdAt: new Date().toISOString(),
      }
      const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
      users.push(author)
      localStorage.setItem("pet_social_users", JSON.stringify(users))

      // User watches the post
      toggleWatch("watcher1", "post1", "post", ["update"])

      // Update the post
      const updatedPost = { ...post, content: "Updated content" }
      updateBlogPost(updatedPost)

      // Check notifications
      const notifications = getNotificationsByUserId("watcher1")
      const watchNotifications = notifications.filter((n) => n.type === "watch_update")

      expect(watchNotifications.length).toBeGreaterThan(0)
      expect(watchNotifications[0]?.targetId).toBe("post1")
      expect(watchNotifications[0]?.targetType).toBe("post")
    })

    it("should notify watchers when a comment is added to a blog post", () => {
      // Create a blog post
      const post: BlogPost = {
        id: "post2",
        petId: "pet1",
        authorId: "author1",
        title: "Test Post 2",
        content: "Content",
        tags: [],
        categories: [],
        likes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const posts = JSON.parse(localStorage.getItem("pet_social_blog_posts") || "[]")
      posts.push(post)
      localStorage.setItem("pet_social_blog_posts", JSON.stringify(posts))

      // Create users
      const author = {
        id: "author1",
        username: "author1",
        fullName: "Author Name",
        email: "author@test.com",
        createdAt: new Date().toISOString(),
      }
      const commenter = {
        id: "commenter1",
        username: "commenter1",
        fullName: "Commenter Name",
        email: "commenter@test.com",
        createdAt: new Date().toISOString(),
      }
      const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
      users.push(author, commenter)
      localStorage.setItem("pet_social_users", JSON.stringify(users))

      // User watches the post for comments
      toggleWatch("watcher1", "post2", "post", ["comment"])

      // Add a comment
      const comment: Comment = {
        id: "comment1",
        userId: "commenter1",
        postId: "post2",
        content: "Great post!",
        format: "plaintext",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "published",
      }

      addComment(comment)

      // Check notifications
      const notifications = getNotificationsByUserId("watcher1")
      const watchNotifications = notifications.filter((n) => n.type === "watch_update")

      expect(watchNotifications.length).toBeGreaterThan(0)
      expect(watchNotifications[0]?.targetId).toBe("post2")
      expect(watchNotifications[0]?.targetType).toBe("post")
    })
  })

  describe("Wiki article updates", () => {
    it("should notify watchers when a wiki article is updated", () => {
      // Create a wiki article
      const article: WikiArticle = {
        id: "wiki1",
        slug: "test-article",
        authorId: "author1",
        title: "Test Article",
        content: "Original content",
        category: "care",
        likes: [],
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const articles = JSON.parse(localStorage.getItem("pet_social_wiki_articles") || "[]")
      articles.push(article)
      localStorage.setItem("pet_social_wiki_articles", JSON.stringify(articles))

      // Create a user for the author
      const author = {
        id: "author1",
        username: "author1",
        fullName: "Author Name",
        email: "author@test.com",
        createdAt: new Date().toISOString(),
      }
      const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
      users.push(author)
      localStorage.setItem("pet_social_users", JSON.stringify(users))

      // User watches the article
      toggleWatch("watcher1", "wiki1", "wiki", ["update"])

      // Update the article
      const updatedArticle = { ...article, content: "Updated content" }
      updateWikiArticle(updatedArticle)

      // Check notifications
      const notifications = getNotificationsByUserId("watcher1")
      const watchNotifications = notifications.filter((n) => n.type === "watch_update")

      expect(watchNotifications.length).toBeGreaterThan(0)
      expect(watchNotifications[0]?.targetId).toBe("wiki1")
      expect(watchNotifications[0]?.targetType).toBe("wiki")
    })

    it("should notify watchers when a comment is added to a wiki article", () => {
      // Create a wiki article
      const article: WikiArticle = {
        id: "wiki2",
        slug: "test-article-2",
        authorId: "author1",
        title: "Test Article 2",
        content: "Content",
        category: "care",
        likes: [],
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const articles = JSON.parse(localStorage.getItem("pet_social_wiki_articles") || "[]")
      articles.push(article)
      localStorage.setItem("pet_social_wiki_articles", JSON.stringify(articles))

      // Create users
      const author = {
        id: "author1",
        username: "author1",
        fullName: "Author Name",
        email: "author@test.com",
        createdAt: new Date().toISOString(),
      }
      const commenter = {
        id: "commenter1",
        username: "commenter1",
        fullName: "Commenter Name",
        email: "commenter@test.com",
        createdAt: new Date().toISOString(),
      }
      const users = JSON.parse(localStorage.getItem("pet_social_users") || "[]")
      users.push(author, commenter)
      localStorage.setItem("pet_social_users", JSON.stringify(users))

      // User watches the article for comments
      toggleWatch("watcher1", "wiki2", "wiki", ["comment"])

      // Add a comment
      const comment: Comment = {
        id: "comment2",
        userId: "commenter1",
        wikiArticleId: "wiki2",
        content: "Great article!",
        format: "plaintext",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "published",
      }

      addComment(comment)

      // Check notifications
      const notifications = getNotificationsByUserId("watcher1")
      const watchNotifications = notifications.filter((n) => n.type === "watch_update")

      expect(watchNotifications.length).toBeGreaterThan(0)
      expect(watchNotifications[0]?.targetId).toBe("wiki2")
      expect(watchNotifications[0]?.targetType).toBe("wiki")
    })
  })
})

