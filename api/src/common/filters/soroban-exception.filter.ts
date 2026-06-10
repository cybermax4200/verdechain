import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export class SorobanException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly contractError?: string,
  ) {
    super(message);
    this.name = 'SorobanException';
  }
}

@Catch(SorobanException)
export class SorobanExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SorobanExceptionFilter.name);

  catch(exception: SorobanException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    this.logger.warn(
      `Soroban error: ${exception.code} - ${exception.message}`,
    );

    response.status(HttpStatus.BAD_GATEWAY).json({
      statusCode: HttpStatus.BAD_GATEWAY,
      message: exception.message,
      code: exception.code,
      contractError: exception.contractError,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
