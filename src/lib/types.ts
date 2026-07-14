/** Shared cross-domain types. */

export interface Pagination {
  page: number;
  pageSize: number;
}
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
export interface ListQuery extends Partial<Pagination> {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  filters?: Record<string, string | number | boolean | null>;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function normalizePagination(q?: Partial<Pagination>): Pagination {
  const page = Math.max(1, Math.floor(q?.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(q?.pageSize ?? DEFAULT_PAGE_SIZE)),
  );
  return { page, pageSize };
}
