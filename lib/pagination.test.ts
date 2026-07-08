import { describe, it, expect } from "vitest"
import {
  parsePagination,
  buildPaginationMeta,
  splitCountedRows,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/lib/pagination"

describe("parsePagination", () => {
  it("defaults to page 1 and DEFAULT_PAGE_SIZE when no params are given", () => {
    const result = parsePagination(new URLSearchParams())
    expect(result).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE, offset: 0 })
  })

  it("computes the correct offset for a given page/limit", () => {
    const result = parsePagination(new URLSearchParams("page=3&limit=10"))
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 })
  })

  it("falls back to defaults for invalid (non-numeric) values", () => {
    const result = parsePagination(new URLSearchParams("page=abc&limit=xyz"))
    expect(result).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE, offset: 0 })
  })

  it("clamps page below 1 back to 1", () => {
    const result = parsePagination(new URLSearchParams("page=-5"))
    expect(result.page).toBe(1)
  })

  it("clamps limit above MAX_PAGE_SIZE", () => {
    const result = parsePagination(new URLSearchParams("limit=99999"))
    expect(result.limit).toBe(MAX_PAGE_SIZE)
  })
})

describe("buildPaginationMeta", () => {
  it("computes totalPages by rounding up", () => {
    expect(buildPaginationMeta(1, 20, 45)).toEqual({ page: 1, limit: 20, total: 45, totalPages: 3 })
  })

  it("handles an exact multiple", () => {
    expect(buildPaginationMeta(1, 20, 40).totalPages).toBe(2)
  })

  it("never reports fewer than 1 page, even when total is 0", () => {
    expect(buildPaginationMeta(1, 20, 0).totalPages).toBe(1)
  })
})

describe("splitCountedRows", () => {
  it("returns an empty result set for no rows", () => {
    expect(splitCountedRows([])).toEqual({ records: [], total: 0 })
  })

  it("strips total_count from each record and reports the total once", () => {
    const rows = [
      { id: 1, nama: "A", total_count: 2 },
      { id: 2, nama: "B", total_count: 2 },
    ]
    const { records, total } = splitCountedRows(rows)
    expect(total).toBe(2)
    expect(records).toEqual([
      { id: 1, nama: "A" },
      { id: 2, nama: "B" },
    ])
  })
})
