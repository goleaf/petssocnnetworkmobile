import { POST } from "../route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock prisma
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

describe("POST /api/admin/wiki/quality/recheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should mark Source.brokenAt null on successful link check", async () => {
    const mockSource = {
      id: "source-123",
      sourceId: "source-id-1",
      title: "Example Source",
      url: "https://example.com",
      isValid: false,
      brokenAt: new Date("2024-01-01"),
      lastChecked: new Date("2024-01-01"),
    };

    (prisma.source.findUnique as jest.Mock).mockResolvedValue(mockSource);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
    (prisma.source.update as jest.Mock).mockResolvedValue({
      ...mockSource,
      isValid: true,
      brokenAt: null,
      lastChecked: new Date(),
    });

    const request = new NextRequest("http://localhost/api/admin/wiki/quality/recheck", {
      method: "POST",
      body: JSON.stringify({ sourceId: "source-123" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source.brokenAt).toBeNull();
    expect(data.source.isValid).toBe(true);

    // Verify update was called with brokenAt: null
    expect(prisma.source.update).toHaveBeenCalledWith({
      where: { id: "source-123" },
      data: {
        isValid: true,
        brokenAt: null,
        lastChecked: expect.any(Date),
      },
    });
  });

  it("should mark Source.brokenAt with date on failed link check", async () => {
    const mockSource = {
      id: "source-123",
      sourceId: "source-id-1",
      title: "Example Source",
      url: "https://example.com",
      isValid: false,
      brokenAt: new Date("2024-01-01"),
      lastChecked: new Date("2024-01-01"),
    };

    (prisma.source.findUnique as jest.Mock).mockResolvedValue(mockSource);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });
    (prisma.source.update as jest.Mock).mockResolvedValue({
      ...mockSource,
      isValid: false,
      brokenAt: new Date(),
      lastChecked: new Date(),
    });

    const request = new NextRequest("http://localhost/api/admin/wiki/quality/recheck", {
      method: "POST",
      body: JSON.stringify({ sourceId: "source-123" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source.brokenAt).not.toBeNull();
    expect(data.source.isValid).toBe(false);

    // Verify update was called with brokenAt set
    expect(prisma.source.update).toHaveBeenCalledWith({
      where: { id: "source-123" },
      data: {
        isValid: false,
        brokenAt: expect.any(Date),
        lastChecked: expect.any(Date),
      },
    });
  });

  it("should return 404 if source not found", async () => {
    (prisma.source.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/admin/wiki/quality/recheck", {
      method: "POST",
      body: JSON.stringify({ sourceId: "non-existent" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Source not found");
  });

  it("should handle fetch errors gracefully", async () => {
    const mockSource = {
      id: "source-123",
      sourceId: "source-id-1",
      title: "Example Source",
      url: "https://example.com",
      isValid: false,
      brokenAt: new Date("2024-01-01"),
      lastChecked: new Date("2024-01-01"),
    };

    (prisma.source.findUnique as jest.Mock).mockResolvedValue(mockSource);
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
    (prisma.source.update as jest.Mock).mockResolvedValue({
      ...mockSource,
      isValid: false,
      brokenAt: new Date(),
      lastChecked: new Date(),
    });

    const request = new NextRequest("http://localhost/api/admin/wiki/quality/recheck", {
      method: "POST",
      body: JSON.stringify({ sourceId: "source-123" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source.isValid).toBe(false);
    expect(data.source.brokenAt).not.toBeNull();
  });

  it("should return 400 for invalid request body", async () => {
    const request = new NextRequest("http://localhost/api/admin/wiki/quality/recheck", {
      method: "POST",
      body: JSON.stringify({ sourceId: "invalid-uuid" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request body");
  });
});

