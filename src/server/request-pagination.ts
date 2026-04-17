import type express from 'express';

export interface PaginationOptions {
  maxLimit?: number;
  defaultLimit?: number;
}

export function getPagination(
  req: express.Request,
  options: PaginationOptions = {},
): { limit: number; offset: number } {
  const maxLimit = options.maxLimit ?? 50;
  const defaultLimit = options.defaultLimit ?? 16;
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(req.query['limit'] ?? String(defaultLimit)), 10) || defaultLimit),
  );
  const offset = Math.max(0, parseInt(String(req.query['offset'] ?? '0'), 10) || 0);
  return { limit, offset };
}
