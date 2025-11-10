/**
 * @jest-environment node
 */
import { GET } from "../route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Mock Prisma client
jest.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
    },
    source: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/wiki/quality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return quality data for all types", async () => {
    const mockArticles = [
      {
        id: "article-1",
        slug: "test-article",
        title: "Test Article",
        type: "care",
        status: "approved",
        updatedAt: new Date(),
        createdAt: new Date(),
        createdById: "user-1",
        revisions: [
          {
            id: "rev-1",
            articleId: "article-1",
            rev: 1,
            authorId: "user-1",
            summary: null,
            contentJSON: {},
            infoboxJSON: null,
            approvedById: "user-2",
            approvedAt: new Date(),
            createdAt: new Date(),
          },
        ],
      },
    ];

    const mockBrokenLinks = [
      {
        id: "source-1",
        articleId: "article-1",
        sourceId: "1",
        title: "Example Source",
        url: "https://example.com",
        publisher: null,
        date: null,
        license: null,
        brokenAt: new Date(),
        isValid: false,
        lastChecked: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        article: {
          id: "article-1",
          slug: "test-article",
          title: "Test Article",
          type: "care",
          status: "approved",
          updatedAt: new Date(),
          createdAt: new Date(),
          createdById: "user-1",
          revisions: [
            {
              id: "rev-1",
              articleId: "article-1",
              rev: 1,
              authorId: "user-1",
              summary: null,
              contentJSON: {},
              infoboxJSON: null,
              approvedById: "user-2",
              approvedAt: new Date(),
              createdAt: new Date(),
            },
          ],
        },
      },
    ];

    (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
    (prisma.source.findMany as jest.Mock).mockResolvedValue(mockBrokenLinks);

    const request = new NextRequest("http://localhost:3000/api/wiki/quality", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.citations).toBeDefined();
    expect(data.reviews).toBeDefined();
    expect(data.links).toBeDefined();
    expect(data.orphaned).toBeDefined();
  });

  it("should filter by type when type parameter is provided", async () => {
    (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.source.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/wiki/quality?type=citations", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.citations).toBeDefined();
    expect(data.reviews).toBeUndefined();
    expect(data.links).toBeUndefined();
    expect(data.orphaned).toBeUndefined();
  });

  it("should return 400 for invalid type parameter", async () => {
    const request = new NextRequest("http://localhost:3000/api/wiki/quality?type=invalid", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid query parameters");
  });

  it("should handle database errors", async () => {
    (prisma.article.findMany as jest.Mock).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/wiki/quality");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch quality data");
  });

  it("should return broken links with lastChecked timestamp", async () => {
    const mockBrokenLink = {
      id: "source-1",
      articleId: "article-1",
      sourceId: "1",
      title: "Example Source",
      url: "https://example.com",
      publisher: null,
      date: null,
      license: null,
      brokenAt: new Date("2024-01-01"),
      isValid: false,
      lastChecked: new Date("2024-01-15"),
      createdAt: new Date(),
      updatedAt: new Date(),
      article: {
        id: "article-1",
        slug: "test-article",
        title: "Test Article",
        type: "care",
        status: "approved",
        updatedAt: new Date(),
        createdAt: new Date(),
        createdById: "user-1",
        revisions: [],
      },
    };

    (prisma.article.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.source.findMany as jest.Mock).mockResolvedValue([mockBrokenLink]);

    const request = new NextRequest("http://localhost:3000/api/wiki/quality?type=links");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.links).toHaveLength(1);
    expect(data.links[0].lastChecked).toBe(mockBrokenLink.lastChecked.toISOString());
    expect(data.links[0].brokenAt).toBe(mockBrokenLink.brokenAt.toISOString());
  });
});

