/**
 * Tests for password change functionality
 */

import { updatePasswordAction } from "@/lib/actions/account"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-server"
import { hash } from "bcryptjs"

// Mock dependencies
jest.mock("@/lib/auth-server")
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>
const mockPrismaUserUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>

describe("updatePasswordAction", () => {
  const userId = "test-user-id"
  const currentPassword = "OldPass123!"
  const newPassword = "NewPass456!"

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should reject unauthorized users", async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const result = await updatePasswordAction({
      userId,
      currentPassword,
      newPassword,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unauthorized")
  })

  it("should reject mismatched user IDs", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "different-user-id",
    } as any)

    const result = await updatePasswordAction({
      userId,
      currentPassword,
      newPassword,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unauthorized")
  })

  it("should reject incorrect current password", async () => {
    const passwordHash = await hash(currentPassword, 12)

    mockGetCurrentUser.mockResolvedValue({ id: userId } as any)
    mockPrismaUserFindUnique.mockResolvedValue({
      id: userId,
      email: "test@example.com",
      passwordHash,
    } as any)

    const result = await updatePasswordAction({
      userId,
      currentPassword: "WrongPassword123!",
      newPassword,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Current password is incorrect")
  })

  it("should reject weak passwords", async () => {
    const passwordHash = await hash(currentPassword, 12)

    mockGetCurrentUser.mockResolvedValue({ id: userId } as any)
    mockPrismaUserFindUnique.mockResolvedValue({
      id: userId,
      email: "test@example.com",
      passwordHash,
    } as any)

    const result = await updatePasswordAction({
      userId,
      currentPassword,
      newPassword: "weak",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("Password must be at least 8 characters")
  })

  it("should reject password same as current", async () => {
    const passwordHash = await hash(currentPassword, 12)

    mockGetCurrentUser.mockResolvedValue({ id: userId } as any)
    mockPrismaUserFindUnique.mockResolvedValue({
      id: userId,
      email: "test@example.com",
      passwordHash,
    } as any)

    const result = await updatePasswordAction({
      userId,
      currentPassword,
      newPassword: currentPassword,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("New password must be different from current password")
  })

  it("should successfully update password with valid inputs", async () => {
    const passwordHash = await hash(currentPassword, 12)

    mockGetCurrentUser.mockResolvedValue({ id: userId } as any)
    mockPrismaUserFindUnique.mockResolvedValueOnce({
      id: userId,
      email: "test@example.com",
      passwordHash,
    } as any)

    mockPrismaUserUpdate.mockResolvedValue({
      id: userId,
      email: "test@example.com",
      passwordHash: "new-hash",
    } as any)

    mockPrismaUserFindUnique.mockResolvedValueOnce({
      id: userId,
      username: "testuser",
      email: "test@example.com",
      passwordHash: "new-hash",
      role: "user",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const result = await updatePasswordAction({
      userId,
      currentPassword,
      newPassword,
    })

    expect(result.success).toBe(true)
    expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: expect.objectContaining({
        passwordHash: expect.any(String),
        passwordChangedAt: expect.any(Date),
        sessionInvalidatedAt: expect.any(Date),
      }),
    })
  })
})
