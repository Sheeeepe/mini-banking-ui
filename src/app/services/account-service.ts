import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { of, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';

type BalanceData = { account_id: number; owner_name: string; currency: string; balance: number };

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _balanceCache = signal<Map<number, BalanceData>>(new Map());

  private readonly API = {
    balance: (id: number) => `${this.apiUrl}/accounts/${id}/balance`,
    convertFiat: (id: number, to: string) => `${this.apiUrl}/accounts/${id}/balance/convert/fiat?to=${to}`,
    convertCrypto: (id: number, to: string) => `${this.apiUrl}/accounts/${id}/balance/convert/crypto?to=${to}`,
  };

  getBalance(id: number) {
    const cached = this._balanceCache().get(id);
    if (cached) return of(cached);

    return this.http.get<BalanceData>(this.API.balance(id)).pipe(
      tap(res => this._balanceCache.update(m => new Map(m).set(id, res)))
    );
  }

  getCached(id: number) {
    const d = this._balanceCache().get(id);
    return d ? { id: d.account_id, owner_name: d.owner_name, currency: d.currency, balance: d.balance } : null;
  }

  clearCache(): void {
    this._balanceCache.set(new Map());
  }

  invalidateBalance(id: number): void {
    this._balanceCache.update(m => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
  }

  convertFiat(id: number, to: string) {
    return this.http.get<{
      account_id: number; provider: string; conversion_type: string;
      from_currency: string; to_currency: string; original_balance: number;
      converted_balance: number; rate: number; date: string;
    }>(this.API.convertFiat(id, to));
  }

  convertCrypto(id: number, to: string) {
    return this.http.get<{
      account_id: number; provider: string; conversion_type: string;
      from_currency: string; to_crypto: string; market_symbol: string;
      original_balance: number; price: number; converted_amount: number;
    }>(this.API.convertCrypto(id, to));
  }

  create(owner_name: string, currency: string) {
    return this.http.post<{ message: string; accountId: number; owner_name: string; currency: string }>(
      `${this.apiUrl}/accounts`, { owner_name, currency }
    );
  }
}
