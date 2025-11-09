import { incrementRegistrationAttempts, resetRegistrationRateLimit, REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS } from "@/lib/server-rate-limit"

describe("registration rate limiter", () => {
  afterEach(() => {
    resetRegistrationRateLimit()
  })

  it("allows up to the configured number of attempts", () => {
    const key = "10.0.0.1"
    for (let i = 0; i < REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS; i++) {
      const result = incrementRegistrationAttempts(key)
      expect(result.allowed).toBe(true)
    }
    const finalAttempt = incrementRegistrationAttempts(key)
    expect(finalAttempt.allowed).toBe(false)
    expect(finalAttempt.remaining).toBe(0)
    expect(finalAttempt.retryAfterMs).toBeGreaterThan(0)
  })

  it("resets counters when reset function is called", () => {
    const key = "192.168.1.5"
    for (let i = 0; i < REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS; i++) {
      incrementRegistrationAttempts(key)
    }
    resetRegistrationRateLimit()
    const result = incrementRegistrationAttempts(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS - 1)
  })
})
