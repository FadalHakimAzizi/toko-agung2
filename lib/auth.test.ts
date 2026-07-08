import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({ cookies: vi.fn() }))

const queryMock = vi.fn()
vi.mock("@/lib/db", () => ({ query: (...args: unknown[]) => queryMock(...args) }))

const {
  hashPassword,
  verifyPassword,
  verifyAgainstDummyHash,
  isAccountLocked,
  registerFailedLogin,
  resetFailedLogin,
  LOGIN_MAX_ATTEMPTS,
} = await import("@/lib/auth")

describe("hashPassword / verifyPassword", () => {
  it("verifies a correct password", () => {
    const stored = hashPassword("rahasia123")
    expect(verifyPassword("rahasia123", stored)).toBe(true)
  })

  it("rejects an incorrect password", () => {
    const stored = hashPassword("rahasia123")
    expect(verifyPassword("password-salah", stored)).toBe(false)
  })

  it("uses a random salt so the same password hashes differently each time", () => {
    const a = hashPassword("sama-sama")
    const b = hashPassword("sama-sama")
    expect(a).not.toBe(b)
    expect(verifyPassword("sama-sama", a)).toBe(true)
    expect(verifyPassword("sama-sama", b)).toBe(true)
  })

  it("rejects a malformed stored hash instead of throwing", () => {
    expect(verifyPassword("apapun", "bukan-hash-yang-valid")).toBe(false)
  })
})

describe("verifyAgainstDummyHash", () => {
  it("runs without throwing for any input (used to normalize login timing)", () => {
    expect(() => verifyAgainstDummyHash("username-tidak-ada")).not.toThrow()
  })
})

describe("isAccountLocked", () => {
  it("is false when locked_until is null", () => {
    expect(isAccountLocked(null)).toBe(false)
  })

  it("is true when locked_until is in the future", () => {
    expect(isAccountLocked(new Date(Date.now() + 60_000))).toBe(true)
  })

  it("is false when locked_until is in the past", () => {
    expect(isAccountLocked(new Date(Date.now() - 60_000))).toBe(false)
  })
})

describe("registerFailedLogin", () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it("only increments the counter while below the lockout threshold", async () => {
    queryMock.mockResolvedValueOnce([{ failed_attempts: LOGIN_MAX_ATTEMPTS - 1 }])
    await registerFailedLogin(1)
    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(queryMock.mock.calls[0][0]).toMatch(/failed_attempts = failed_attempts \+ 1/)
  })

  it("locks the account once attempts reach the threshold", async () => {
    queryMock.mockResolvedValueOnce([{ failed_attempts: LOGIN_MAX_ATTEMPTS }])
    queryMock.mockResolvedValueOnce([])
    await registerFailedLogin(1)
    expect(queryMock).toHaveBeenCalledTimes(2)
    expect(queryMock.mock.calls[1][0]).toMatch(/locked_until/)
  })
})

describe("resetFailedLogin", () => {
  it("clears both the counter and the lock", async () => {
    queryMock.mockReset()
    queryMock.mockResolvedValueOnce([])
    await resetFailedLogin(1)
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("failed_attempts = 0"), [1])
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("locked_until = NULL"), [1])
  })
})
