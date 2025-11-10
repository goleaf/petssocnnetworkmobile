import { describeCorporateEmail, validateEmailAddress, isDisposableEmail } from "@/lib/registration-policy"

describe("registration policy helpers", () => {
  it("rejects disposable email domains", () => {
    const email = "user@mailinator.com"
    const result = validateEmailAddress(email)
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/disposable/i)
    expect(isDisposableEmail(email)).toBe(true)
  })

  it("validates corporate domains that are allowlisted", () => {
    const email = "employee@petsmart.com"
    const corporate = describeCorporateEmail(email)
    expect(corporate?.isCorporate).toBe(true)
    expect(corporate?.verified).toBe(true)
    expect(corporate?.organization).toBe("PetSmart")
  })

  it("flags unknown corporate domains for manual review", () => {
    const email = "team@newpetstartup.io"
    const corporate = describeCorporateEmail(email)
    expect(corporate?.isCorporate).toBe(true)
    expect(corporate?.verified).toBe(false)
    expect(corporate?.requiresManualReview).toBe(true)
  })
})
