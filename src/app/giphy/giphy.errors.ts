export type GiphyAppErrorCode =
  | 'RATE_LIMIT'
  | 'BAD_REQUEST'
  | 'UPSTREAM'
  | 'NETWORK'
  | 'UNKNOWN';

export class GiphyAppError extends Error {
  readonly code: GiphyAppErrorCode;
  readonly status?: number;

  constructor(message: string, code: GiphyAppErrorCode, status?: number) {
    super(message);
    this.name = 'GiphyAppError';
    this.code = code;
    this.status = status;
  }
}

export interface ApiErrorBody {
  error: {
    code: GiphyAppErrorCode;
    message: string;
    status?: number;
  };
}
