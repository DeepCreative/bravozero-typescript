/**
 * Bravo Zero SDK Errors
 */

export class BravoZeroError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BravoZeroError';
  }
}

export class AuthenticationError extends BravoZeroError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends BravoZeroError {
  constructor(
    message: string,
    public readonly retryAfter: number = 60,
    details?: Record<string, any>
  ) {
    super(message, details);
    this.name = 'RateLimitError';
  }
}

export class ConstitutionDeniedError extends BravoZeroError {
  constructor(
    public readonly reasoning: string,
    public readonly result?: any,
    details?: Record<string, any>
  ) {
    super(reasoning, details);
    this.name = 'ConstitutionDeniedError';
  }
}

export class MemoryError extends BravoZeroError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, details);
    this.name = 'MemoryError';
  }
}

export class BridgeError extends BravoZeroError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, details);
    this.name = 'BridgeError';
  }
}
