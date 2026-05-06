import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { AUTH_TOKEN_STORAGE_KEY } from '../auth/auth-storage';

import { ProgressService } from './progress.service';

const USER_KEY = 'spanish-auth-user';

export interface AuthUser {
  id: number;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly progress = inject(ProgressService);

  private readonly tokenData = signal<string | null>(this.readToken());
  private readonly userData = signal<AuthUser | null>(this.readUser());

  readonly token = this.tokenData.asReadonly();
  readonly user = this.userData.asReadonly();
  readonly isLoggedIn = computed(() => !!this.tokenData());

  register(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/auth/register', { username, password })
      .pipe(tap((res) => this.persist(res)));
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/auth/login', { username, password })
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    this.tokenData.set(null);
    this.userData.set(null);
    this.progress.onLogout();
    void this.router.navigateByUrl('/');
  }

  static formatHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string | string[] } | null;
      const msg = body?.message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
      return err.status === 0
        ? 'Network error. Is the backend running?'
        : `Error ${err.status}`;
    }
    return 'Something went wrong';
  }

  private persist(res: AuthResponse): void {
    try {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, res.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {
      /* ignore */
    }
    this.tokenData.set(res.accessToken);
    this.userData.set(res.user);
    this.progress.syncFromServer();
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
