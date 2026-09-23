import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import type { ApiError } from '@grh/types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ method: string; url: string; ip?: string }>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let apiError: Partial<ApiError> = {
      code: 'INTERNAL_ERROR',
      message: 'Une erreur interne est survenue.',
    };

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        apiError = { code: `HTTP_${statusCode}`, message: body };
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        apiError = {
          statusCode,
          code: (b.code as string) ?? `HTTP_${statusCode}`,
          message: (b.message as string) ?? exception.message,
          details: (b.details as Record<string, unknown>) ?? undefined,
        };
      }
    } else if (exception instanceof Error) {
      // Erreur Zod capturée via le pipe de validation : exception déjà structurée en ApiError?
      const anyErr = exception as unknown as Partial<ApiError> & { name?: string };
      if (anyErr.code && anyErr.message && anyErr.statusCode) {
        statusCode = anyErr.statusCode;
        apiError = { code: anyErr.code, message: anyErr.message, details: anyErr.details };
      } else {
        this.logger.error(
          `${request.method} ${request.url} : ${exception.message}\n${exception.stack}`,
        );
      }
    }

    if (statusCode >= 500) {
      this.logger.error(`${request.method} ${request.url} -> ${statusCode} ${apiError.message}`);
    }

    apiError.statusCode = statusCode;
    apiError.path = `${request.method} ${request.url}`;
    apiError.timestamp = new Date().toISOString();

    response.status(statusCode).json(apiError);
  }
}