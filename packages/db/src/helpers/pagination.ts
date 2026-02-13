export type PaginationParams = {
  page?: number
  pageSize?: number
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export function paginationArgs(params: PaginationParams = {}) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE))
  const skip = (page - 1) * pageSize

  return {
    take: pageSize,
    skip,
    page,
    pageSize,
    toResponse<T>(items: T[], total: number): PaginatedResponse<T> {
      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    },
  }
}
