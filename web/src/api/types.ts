export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export function withPagination<T>(response: T[], meta: unknown): Paginated<T> {
  return {
    items: response,
    meta: (meta as Paginated<T>['meta']) ?? { page: 1, limit: response.length, total: response.length, totalPages: 1 },
  };
}
