import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';

export const CRYPTO_SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP',
  'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK',
  'LTC', 'ATOM', 'UNI', 'XLM', 'ALGO',
  'BCH', 'ICP', 'FIL', 'NEAR', 'APT',
] as const;

const FIAT_FALLBACK = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK',
  'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK',
  'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN',
  'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR',
];

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private http = inject(HttpClient);

  readonly cryptoSymbols: string[] = [...CRYPTO_SYMBOLS];

  private readonly _fiatCurrencies = signal<string[]>([]);
  readonly fiatCurrencies = this._fiatCurrencies.asReadonly();

  loadFiatCurrencies() {
    if (this._fiatCurrencies().length > 0) return of(void 0);

    return this.http
      .get<Record<string, string>>('https://api.frankfurter.app/currencies')
      .pipe(
        tap(res => this._fiatCurrencies.set(Object.keys(res))),
        map(() => void 0),
        catchError(() => {
          this._fiatCurrencies.set(FIAT_FALLBACK);
          return of(void 0);
        })
      );
  }
}
