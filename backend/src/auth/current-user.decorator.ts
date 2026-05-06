import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUserPayload, RequestWithUser } from './auth-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload | undefined => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    return req.user;
  },
);
