import { Request } from 'express';

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parses page/limit from request query string with safe defaults.
 * @param query   - req.query
 * @param maxLimit - hard cap on limit (default 100)
 * @param defaultLimit - default limit when not supplied (default 20)
 */
export const parsePagination = (
  query: Request['query'],
  maxLimit = 100,
  defaultLimit = 20,
): PaginationResult => {
  const page = Math.max(1, parseInt((query.page as string) || '1', 10));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt((query.limit as string) || String(defaultLimit), 10)),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Builds a standard pagination response envelope.
 */
export const buildPaginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});
