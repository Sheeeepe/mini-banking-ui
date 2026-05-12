import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly API = {
    account: (id: number) => `${this.apiUrl}/accounts/${id}`,
    balance: (id: number) => `${this.apiUrl}/accounts/${id}/balance`,
    convertFiat: (id: number, to: string) => `${this.apiUrl}/accounts/${id}/balance/convert/fiat?to=${to}`,
    convertCrypto: (id: number, to: string) => `${this.apiUrl}/accounts/${id}/balance/convert/crypto?to=${to}`,
  };

  getBalance(id: number) {
    return this.http.get<{ account_id: number; owner_name: string; currency: string; balance: number }>(
      this.API.balance(id)
    );
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
