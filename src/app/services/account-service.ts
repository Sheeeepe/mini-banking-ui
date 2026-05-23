import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AccountModel } from '../models/account-model';

type BalanceData = { account_id: number; owner_name: string; currency: string; balance: number };

export type CachedAccount = Omit<AccountModel, 'created_at'>;

export type AccountDetails = { id: number; owner_name: string; currency: string; created_at: string };

type FiatConversionResult = {
  account_id: number; provider: string; conversion_type: string;
  from_currency: string; to_currency: string; original_balance: number;
  converted_balance: number; rate: number; date: string;
};

type CryptoConversionResult = {
  account_id: number; provider: string; conversion_type: string;
  from_currency: string; to_crypto: string; market_symbol: string;
  original_balance: number; price: number; converted_amount: number;
};

type CreateAccountResult = { message: string; accountId: number; owner_name: string; currency: string };

type ApiRoutes = {
  account: (id: number) => string;
  balance: (id: number) => string;
  convertFiat: (id: number, to: string) => string;
  convertCrypto: (id: number, to: string) => string;
};

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = environment.apiUrl;

  private readonly _balanceCache = signal<Map<number, BalanceData>>(new Map());

  private readonly API: ApiRoutes = {
    account: (id: number): string => `${this.apiUrl}/accounts/${id}`,
    balance: (id: number): string => `${this.apiUrl}/accounts/${id}/balance`,
    convertFiat: (id: number, to: string): string => `${this.apiUrl}/accounts/${id}/balance/convert/fiat?to=${to}`,
    convertCrypto: (id: number, to: string): string => `${this.apiUrl}/accounts/${id}/balance/convert/crypto?to=${to}`,
  };

  getBalance(id: number): Observable<BalanceData> {
    const cached: BalanceData | undefined = this._balanceCache().get(id);
    if (cached) return of(cached);

    return this.http.get<BalanceData>(this.API.balance(id)).pipe(
      tap(res => this._balanceCache.update(m => new Map(m).set(id, res)))
    );
  }

  getCached(id: number): CachedAccount | null {
    const d: BalanceData | undefined = this._balanceCache().get(id);
    return d ? { id: d.account_id, owner_name: d.owner_name, currency: d.currency, balance: d.balance } : null;
  }

  invalidateBalance(id: number): void {
    this._balanceCache.update((m: Map<number, BalanceData>) => {
      const next: Map<number, BalanceData> = new Map(m);
      next.delete(id);
      return next;
    });
  }

  patchCachedOwnerName(id: number, ownerName: string): void {
    this._balanceCache.update((m: Map<number, BalanceData>) => {
      const existing: BalanceData | undefined = m.get(id);
      if (!existing) return m;
      return new Map(m).set(id, { ...existing, owner_name: ownerName });
    });
  }

  getAccount(id: number): Observable<AccountDetails> {
    return this.http.get<AccountDetails>(this.API.account(id));
  }

  updateAccount(id: number, ownerName: string): Observable<{ message: string; account: AccountDetails }> {
    return this.http.put<{ message: string; account: AccountDetails }>(
      this.API.account(id), { owner_name: ownerName }
    );
  }

  deleteAccount(id: number): Observable<{ message: string; account_id: number }> {
    return this.http.delete<{ message: string; account_id: number }>(this.API.account(id));
  }

  convertFiat(id: number, to: string): Observable<FiatConversionResult> {
    return this.http.get<FiatConversionResult>(this.API.convertFiat(id, to));
  }

  convertCrypto(id: number, to: string): Observable<CryptoConversionResult> {
    return this.http.get<CryptoConversionResult>(this.API.convertCrypto(id, to));
  }

  create(owner_name: string, currency: string): Observable<CreateAccountResult> {
    return this.http.post<CreateAccountResult>(
      `${this.apiUrl}/accounts`, { owner_name, currency }
    );
  }
}
