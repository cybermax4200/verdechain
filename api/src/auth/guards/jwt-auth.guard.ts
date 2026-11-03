import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    if (process.env.NODE_ENV === 'test' || process.env.AUTH_DISABLED === 'true') {
      const req = context.switchToHttp().getRequest();
      if (!req.user) {
        req.user = { sub: 'GA7QYNF7SOWQ3GLR2ZGMH7G7Y4S5XZ7Y6S5XZ7Y6S5XZ', roles: ['user', 'manufacturer', 'verifier'] };
      }
      return true;
    }
    return super.canActivate(context);
  }

  override handleRequest<TUser = any>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
