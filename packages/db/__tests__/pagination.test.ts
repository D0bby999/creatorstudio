import { describe, it, expect } from 'vitest'
import { paginationArgs } from '../src/helpers/pagination'

describe('paginationArgs', () => {
  it('returns defaults when no params', () => {
    const p = paginationArgs()
    expect(p.take).toBe(20)
    expect(p.skip).toBe(0)
    expect(p.page).toBe(1)
    expect(p.pageSize).toBe(20)
  })

  it('calculates skip for page 3', () => {
    const p = paginationArgs({ page: 3, pageSize: 10 })
    expect(p.take).toBe(10)
    expect(p.skip).toBe(20)
    expect(p.page).toBe(3)
  })

  it('clamps pageSize to max 100', () => {
    const p = paginationArgs({ pageSize: 500 })
    expect(p.pageSize).toBe(100)
    expect(p.take).toBe(100)
  })

  it('clamps page to min 1', () => {
    const p = paginationArgs({ page: -5 })
    expect(p.page).toBe(1)
    expect(p.skip).toBe(0)
  })

  it('clamps pageSize to min 1', () => {
    const p = paginationArgs({ pageSize: 0 })
    expect(p.pageSize).toBe(1)
  })

  describe('toResponse', () => {
    it('builds paginated response with metadata', () => {
      const p = paginationArgs({ page: 2, pageSize: 10 })
      const response = p.toResponse(['a', 'b', 'c'], 25)

      expect(response).toEqual({
        items: ['a', 'b', 'c'],
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      })
    })

    it('handles zero total', () => {
      const p = paginationArgs()
      const response = p.toResponse([], 0)

      expect(response.totalPages).toBe(0)
      expect(response.items).toEqual([])
    })

    it('calculates totalPages correctly for exact division', () => {
      const p = paginationArgs({ pageSize: 5 })
      const response = p.toResponse([], 15)
      expect(response.totalPages).toBe(3)
    })

    it('rounds up totalPages for remainder', () => {
      const p = paginationArgs({ pageSize: 10 })
      const response = p.toResponse([], 21)
      expect(response.totalPages).toBe(3)
    })
  })
})
