import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AccountService } from './account-service';
import { TransactionService } from './transaction-service';
import { SelectedAccountService } from './selected-account.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private selectedAccountSvc = inject(SelectedAccountService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _token = signal<string | null>(localStorage.getItem('auth_token'));
  private readonly _email = signal<string | null>(localStorage.getItem('auth_email'));

  readonly token = this._token.asReadonly();
  readonly email = this._email.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  login(email: string, password: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.persistSession(res.token, email))
    );
  }

  register(email: string, password: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/register`, { email, password }).pipe(
      tap(res => this.persistSession(res.token, email))
    );
  }

  logout(): void {
    const tok = this._token();
    this.clearSession();
    this.router.navigate(['/login']);

    // Best-effort server-side revocation — fire and forget
    if (tok) {
      this.http
        .post(`${this.apiUrl}/auth/logout`, {}, { headers: { Authorization: `Bearer ${tok}` } })
        .subscribe({ error: () => {} });
    }
  }

  getGoogleAuthUrl() {
    return this.http.get<{ url: string }>(`${this.apiUrl}/auth/google`);
  }

  /** Called from the Google OAuth callback page once the backend redirects here with ?token= */
  saveGoogleToken(token: string): void {
    this.persistSession(token, null);
  }

  clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    this._token.set(null);
    this._email.set(null);
    this.selectedAccountSvc.clear();
    this.accountService.clearCache();
    this.transactionService.clearCache();
  }

  private persistSession(token: string, email: string | null): void {
    localStorage.setItem('auth_token', token);
    this._token.set(token);
    if (email) {
      localStorage.setItem('auth_email', email);
      this._email.set(email);
    }
  }
}
