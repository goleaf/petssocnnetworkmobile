import { POST } from "../route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("POST /api/admin/wiki/quality/assign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should persist assignedTo field when assigning reviewer", async () => {
    const mockArticle = {
      id: "article-123",
      slug: "test-article",
      title: "Test Article",
      type: "Health",
      status: "approved",
      assignedTo: null,
    };

    const updatedArticle = {
      ...mockArticle,
      assignedTo: "reviewer-456",
    };

    (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
    (prisma.article.update as jest.Mock).mockResolvedValue(updatedArticle);

    const request = new NextRequest("http://localhost/api/admin/wiki/quality/assign", {
      method: "POST",
      body: JSON.stringify({
        articleId: "article-123",
        reviewerId: "reviewer-456",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.assignment.assignedTo).toBe("reviewer-456");
    expect(data.assignment.articleId).toBe("article-123");

    // Verify update was called with assignedTo
    expect(prisma.article.update).toHaveBeenCalledWith({
      where: { id: "article-123" },
      data: {
        assignedTo: "reviewer-456",
      },
    });
  });

  it("should persist assignedTo as null when reviewerId is not provided", async () => {
    const mockArticle = {
      id: "article-123",
      slug: "test-article",
      title: "Test Article",
      type: "Health",
      status: "approved",
      assignedTo: "reviewer-456",
    };

    const updatedArticle = {
      ...mockArticle,
      assignedTo: null,
    };

    (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
    (prisma.article.update as jest.Mock).mockResolvedValue(updatedArticle);

    const request = new NextRequest("http://localhost/api/admin/wiki/quality/assign", {
      method: "POST",
      body: JSON.stringify({
        articleId: "article-123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.assignment.assignedTo).toBeNull();

    // Verify update was called with assignedTo: null
    expect(prisma.article.update).toHaveBeenCalledWith({
      where: { id: "article-123" },
      data: {
        assignedTo: null,
      },
    });
  });

  it("should return 404 if article not found", async () => {
    (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/admin/wiki/quality/assign", {
      method: "POST",
      body: JSON.stringify({
        articleId: "non-existent",
        reviewerId: "reviewer-456",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Article not found");
  });

  it("should return 400 for invalid request body", async () => {
    const request = new NextRequest("http://localhost/api/admin/wiki/quality/assign", {
      method: "POST",
      body: JSON.stringify({
        articleId: "invalid-uuid",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request body");
  });

  it("should handle optional section parameter", async () => {
    const mockArticle = {
      id: "article-123",
      slug: "test-article",
      title: "Test Article",
      type: "Health",
      status: "approved",
      assignedTo: null,
    };

    const updatedArticle = {
      ...mockArticle,
      assignedTo: "reviewer-456",
    };

    (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
    (prisma.article.update as jest.Mock).mockResolvedValue(updatedArticle);

    const request = new NextRequest("http://localhost/api/admin/wiki/quality/assign", {
      method: "POST",
      body: JSON.stringify({
        articleId: "article-123",
        reviewerId: "reviewer-456",
        section: "health-section",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.assignment.section).toBe("health-section");
  });
});

