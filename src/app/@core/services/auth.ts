import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../models/auth.models';

const STORAGE_KEY = 'nextgen.auth.user';

@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly api = environment.api;

  private readonly currentUser = signal<AuthUser | null>(this.readStoredUser());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  login(credentials: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${this.api}/auth/login`, credentials)
      .pipe(tap((response) => this.persist(response.user)));
  }

  register(payload: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, payload);
  }

  logout(): void {
    this.currentUser.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(user: AuthUser): void {
    this.currentUser.set(user);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }

  private readStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
