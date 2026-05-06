import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { RequestWithUser } from './auth-user';
import { extractBearerToken, verifyAccessTokenUser } from './jwt-user.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Log in to save known words.');
    }
    const user = verifyAccessTokenUser(this.jwt, token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session.');
    }
    req.user = user;
    return true;
  }
}
