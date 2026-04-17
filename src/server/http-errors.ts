import axios, { AxiosError } from 'axios';
import type express from 'express';
import type { GiphyAppErrorCode } from '../app/giphy/giphy.errors';

export function sendError(
  res: express.Response,
  status: number,
  message: string,
  code: GiphyAppErrorCode,
): void {
  res.status(status).json({
    error: { code, message, status },
  });
}

export function requireApiKey(res: express.Response): string | null {
  const key = process.env['GIPHY_API_KEY']?.trim();
  if (!key) {
    sendError(
      res,
      500,
      'GIPHY_API_KEY is not set. Add it to .env (see .env.example).',
      'BAD_REQUEST',
    );
    return null;
  }
  return key;
}

export function mapAxiosError(err: unknown, res: express.Response): void {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string }>;
    const status = ax.response?.status ?? 502;
    if (status === 429) {
      sendError(
        res,
        429,
        'Giphy rate limit exceeded. Please try again later.',
        'RATE_LIMIT',
      );
      return;
    }
    const msg =
      ax.response?.data?.message ||
      ax.message ||
      'Error calling Giphy API.';
    sendError(res, status >= 400 && status < 600 ? status : 502, msg, 'UPSTREAM');
    return;
  }
  sendError(res, 500, 'Internal server error.', 'UNKNOWN');
}
