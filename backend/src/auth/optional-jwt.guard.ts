import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { RequestWithUser } from './auth-user';
import { extractBearerToken, verifyAccessTokenUser } from './jwt-user.util';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const token = extractBearerToken(req.headers.authorization);
    req.user = token ? verifyAccessTokenUser(this.jwt, token) : undefined;
    return true;
  }
}
