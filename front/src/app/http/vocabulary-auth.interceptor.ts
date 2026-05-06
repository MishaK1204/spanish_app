import { HttpInterceptorFn } from '@angular/common/http';

import { readStoredAccessToken } from '../auth/auth-storage';

/** Adds Bearer token for `/vocabulary/*` when logged in (learned endpoints require auth). */
export const vocabularyAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/vocabulary/')) {
    return next(req);
  }
  const token = readStoredAccessToken();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
