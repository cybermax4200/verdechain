import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          if (method !== 'GET') {
            this.logger.log(
              `User ${user?.sub ?? 'anonymous'} performed ${method} ${url}`,
            );
          }
        },
        error: (error: Error) => {
          this.logger.warn(
            `User ${user?.sub ?? 'anonymous'} failed ${method} ${url}: ${error.message}`,
          );
        },
      }),
    );
  }
}
