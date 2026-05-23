import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '../../environments/environment.development';
import { AccountModel } from '../models/account-model';

export type BalanceData = { account_id: number; owner_name: string; currency: string; balance: number };
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

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private queryClient = inject(QueryClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly API = {
    accounts: () => `${this.apiUrl}/accounts`,
    account: (id: number) => `${this.apiUrl}/accounts/${id}`,
    balance: (id: number) => `${this.apiUrl}/accounts/${id}/balance`,
    convertFiat: (id: number, to: string) => `${this.apiUrl}/accounts/${id}/balance/convert/fiat?to=${to}`,
    convertCrypto: (id: number, to: string) =>
      `${this.apiUrl}/accounts/${id}/balance/convert/crypto?to=${to}`,
  };

  getBalance(id: number): Observable<BalanceData> {
    return this.http.get<BalanceData>(this.API.balance(id));
  }

  /** Reads synchronously from TanStack cache — returns null if not yet fetched. */
  getCached(id: number): CachedAccount | null {
    const d = this.queryClient.getQueryData<BalanceData>(['balance', id]);
    if (!d) return null;
    return { id: d.account_id, owner_name: d.owner_name, currency: d.currency, balance: d.balance };
  }

  getAccount(id: number): Observable<AccountDetails> {
    return this.http.get<AccountDetails>(this.API.account(id));
  }

  updateAccount(id: number, ownerName: string): Observable<{ message: string; account: AccountDetails }> {
    return this.http.put<{ message: string; account: AccountDetails }>(
      this.API.account(id),
      { owner_name: ownerName },
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
    return this.http.post<CreateAccountResult>(this.API.accounts(), { owner_name, currency });
  }
}
