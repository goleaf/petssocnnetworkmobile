import {
  createEmailVerificationRecord,
  getEmailVerificationRecord,
  consumeEmailVerificationToken,
  resetEmailVerificationStore,
} from "@/lib/email-verification-store"

describe("email verification store", () => {
  beforeEach(() => {
    resetEmailVerificationStore()
  })

  it("creates and retrieves verification tokens", () => {
    const record = createEmailVerificationRecord("user-123", "user@example.com", 1000)
    const lookup = getEmailVerificationRecord(record.token)
    expect(lookup).toBeDefined()
    expect(lookup?.userId).toBe("user-123")
  })

  it("consumes tokens only once", () => {
    const record = createEmailVerificationRecord("user-456", "team@example.com", 1000)
    const consumed = consumeEmailVerificationToken(record.token)
    expect(consumed?.userId).toBe("user-456")
    const secondAttempt = consumeEmailVerificationToken(record.token)
    expect(secondAttempt).toBeUndefined()
  })
})
