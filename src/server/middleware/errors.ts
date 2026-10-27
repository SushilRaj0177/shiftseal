import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v3';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data provided.',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // Malformed or oversized bodies rejected by express.json()
  const bodyError = err as { type?: string; status?: number } | null;
  if (bodyError?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'MALFORMED_JSON', message: 'Request body is not valid JSON.' });
    return;
  }
  if (bodyError?.type === 'entity.too.large') {
    res.status(413).json({ error: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  // Never log raw request bodies or sensitive feedback content
  const safeMessage = err instanceof Error ? err.name : 'UnknownError';
  console.error(`[Server Error]: ${safeMessage}`);

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Unable to complete the request right now. Please try again.',
  });
}
