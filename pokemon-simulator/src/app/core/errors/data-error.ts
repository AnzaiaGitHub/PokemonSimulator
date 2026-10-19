export type DataErrorKind = 'network' | 'not-found' | 'rate-limit';

export class NetworkError extends Error {
  readonly kind = 'network' as const;

  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends Error {
  readonly kind = 'not-found' as const;

  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  readonly kind = 'rate-limit' as const;

  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export type DataError = NetworkError | NotFoundError | RateLimitError;
