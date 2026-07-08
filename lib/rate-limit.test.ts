import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { isRateLimited, getClientIp } from "@/lib/rate-limit"

describe("isRateLimited", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("allows requests up to the limit then blocks further ones", () => {
    const key = `test-${Math.random()}`
    expect(isRateLimited(key, 3, 60_000)).toBe(false)
    expect(isRateLimited(key, 3, 60_000)).toBe(false)
    expect(isRateLimited(key, 3, 60_000)).toBe(false)
    expect(isRateLimited(key, 3, 60_000)).toBe(true)
  })

  it("resets once the time window has passed", () => {
    const key = `test-${Math.random()}`
    expect(isRateLimited(key, 1, 1000)).toBe(false)
    expect(isRateLimited(key, 1, 1000)).toBe(true)
    vi.advanceTimersByTime(1001)
    expect(isRateLimited(key, 1, 1000)).toBe(false)
  })

  it("tracks separate keys independently", () => {
    const keyA = `a-${Math.random()}`
    const keyB = `b-${Math.random()}`
    expect(isRateLimited(keyA, 1, 60_000)).toBe(false)
    expect(isRateLimited(keyB, 1, 60_000)).toBe(false)
    expect(isRateLimited(keyA, 1, 60_000)).toBe(true)
    expect(isRateLimited(keyB, 1, 60_000)).toBe(true)
  })
})

describe("getClientIp", () => {
  it("reads the first address from x-forwarded-for", () => {
    const req = new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("http://localhost", { headers: { "x-real-ip": "9.9.9.9" } })
    expect(getClientIp(req)).toBe("9.9.9.9")
  })

  it("returns 'unknown' when neither header is present", () => {
    const req = new Request("http://localhost")
    expect(getClientIp(req)).toBe("unknown")
  })
})
