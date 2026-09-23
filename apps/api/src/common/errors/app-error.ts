import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiError } from '@grh/types';

/**
 * Erreur métier structurée conforme au format API (§30 du prompt) :
 * `{ statusCode, code, message, details }`.
 */
export class AppError extends HttpException {
  constructor(
    code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>,
  ) {
    const body: Partial<ApiError> = { code, message, details };
    super(body, status);
  }

  static notFound(code: string, message: string): AppError {
    return new AppError(code, message, HttpStatus.NOT_FOUND);
  }

  static forbidden(code: string, message: string): AppError {
    return new AppError(code, message, HttpStatus.FORBIDDEN);
  }

  static unauthorized(code: string, message: string): AppError {
    return new AppError(code, message, HttpStatus.UNAUTHORIZED);
  }

  static conflict(code: string, message: string): AppError {
    return new AppError(code, message, HttpStatus.CONFLICT);
  }

  static tooManyRequests(code: string, message: string): AppError {
    return new AppError(code, message, HttpStatus.TOO_MANY_REQUESTS);
  }
}