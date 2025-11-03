/**
 * @jest-environment node
 */
import { POST } from "../route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Mock Prisma client
jest.mock("@/lib/prisma", () => ({
  prisma: {
    source: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe("POST /api/wiki/quality/recheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should queue recheck for a broken link", async () => {
    const mockSource = {
      id: "00000000-0000-0000-0000-000000000001",
      articleId: "00000000-0000-0000-0000-000000000002",
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
    };

    (prisma.source.findUnique as jest.Mock).mockResolvedValue(mockSource);
    (prisma.source.update as jest.Mock).mockResolvedValue({
      ...mockSource,
      lastChecked: new Date(),
      isValid: null,
      brokenAt: null,
    });

    // Mock successful fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const request = new NextRequest("http://localhost:3000/api/wiki/quality/recheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "00000000-0000-0000-0000-000000000001" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBeDefined();
    expect(prisma.source.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "00000000-0000-0000-0000-000000000001" },
        data: expect.objectContaining({
          lastChecked: expect.any(Date),
        }),
      })
    );
  });

  it("should return 400 for invalid request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/wiki/quality/recheck", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request body");
  });

  it("should return 404 for non-existent source", async () => {
    (prisma.source.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/wiki/quality/recheck", {
      method: "POST",
      body: JSON.stringify({ sourceId: "00000000-0000-0000-0000-000000000999" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Source not found");
  });

  it("should mark link as broken if fetch fails", async () => {
    const mockSource = {
      id: "source-1",
      articleId: "article-1",
      sourceId: "1",
      title: "Example Source",
      url: "https://example.com",
      publisher: null,
      date: null,
      license: null,
      brokenAt: null,
      isValid: null,
      lastChecked: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.source.findUnique as jest.Mock).mockResolvedValue(mockSource);
    (prisma.source.update as jest.Mock).mockResolvedValue(mockSource);

    // Mock failed fetch
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const request = new NextRequest("http://localhost:3000/api/wiki/quality/recheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "00000000-0000-0000-0000-000000000001" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source.isValid).toBe(false);
    expect(data.source.brokenAt).toBeDefined();
  });

  it("should mark link as valid if fetch succeeds", async () => {
    const mockSource = {
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
    };

    (prisma.source.findUnique as jest.Mock).mockResolvedValue(mockSource);
    (prisma.source.update as jest.Mock)
      .mockResolvedValueOnce({
        ...mockSource,
        lastChecked: new Date(),
        isValid: null,
        brokenAt: null,
      })
      .mockResolvedValueOnce({
        ...mockSource,
        isValid: true,
        brokenAt: null,
        lastChecked: new Date(),
      });

    // Mock successful fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const request = new NextRequest("http://localhost:3000/api/wiki/quality/recheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "00000000-0000-0000-0000-000000000001" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source.isValid).toBe(true);
    expect(data.source.brokenAt).toBeNull();
  });

  it("should handle database errors", async () => {
    (prisma.source.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/wiki/quality/recheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "00000000-0000-0000-0000-000000000001" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to recheck link");
  });
});

