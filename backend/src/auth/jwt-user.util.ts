import { JwtService } from '@nestjs/jwt';

import type { AuthUserPayload } from './auth-user';

export function extractBearerToken(authorization: unknown): string | undefined {
  if (typeof authorization !== 'string') return undefined;
  const prefix = 'Bearer ';
  if (!authorization.startsWith(prefix)) return undefined;
  const t = authorization.slice(prefix.length).trim();
  return t.length > 0 ? t : undefined;
}

export function verifyAccessTokenUser(
  jwt: JwtService,
  token: string,
): AuthUserPayload | undefined {
  try {
    const payload = jwt.verify<{
      sub: number | string;
      username: string;
    }>(token);
    const id =
      typeof payload.sub === 'number'
        ? payload.sub
        : parseInt(String(payload.sub), 10);
    if (!Number.isFinite(id)) return undefined;
    return { id, username: payload.username };
  } catch {
    return undefined;
  }
}
