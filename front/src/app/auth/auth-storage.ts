export const AUTH_TOKEN_STORAGE_KEY = 'spanish-auth-token';

export function readStoredAccessToken(): string | undefined {
  try {
    const t = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return t && t.length > 0 ? t : undefined;
  } catch {
    return undefined;
  }
}

export function hasStoredAccessToken(): boolean {
  return readStoredAccessToken() !== undefined;
}
