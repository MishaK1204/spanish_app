import type { Request } from 'express';

export type AuthUserPayload = {
  id: number;
  username: string;
};

export type RequestWithUser = Request & {
  user?: AuthUserPayload;
};
