import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';

const FIAT_FALLBACK = [
  'AUD',
  'BGN',
  'BRL',
  'CAD',
  'CHF',
  'CNY',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'ISK',
  'JPY',
  'KRW',
  'MXN',
  'MYR',
  'NOK',
  'NZD',
  'PHP',
  'PLN',
  'RON',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'USD',
  'ZAR',
];

const CRYPTO_FALLBACK = [
  'ADA',
  'ALGO',
  'APT',
  'ATOM',
  'AVAX',
  'BCH',
  'BNB',
  'BTC',
  'DOT',
  'ETH',
  'FIL',
  'ICP',
  'LINK',
  'LTC',
  'MATIC',
  'NEAR',
  'SOL',
  'UNI',
  'XLM',
  'XRP',
];

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private http = inject(HttpClient);

  private readonly _fiatCurrencies = signal<string[]>([]);
  readonly fiatCurrencies = this._fiatCurrencies.asReadonly();

  private readonly _cryptoSymbols = signal<string[]>([]);
  readonly cryptoSymbols = this._cryptoSymbols.asReadonly();

  loadFiatCurrencies() {
    if (this._fiatCurrencies().length > 0) return of(void 0);

    return this.http.get<Record<string, string>>('https://api.frankfurter.app/currencies').pipe(
      tap((res) => this._fiatCurrencies.set(Object.keys(res).sort())),
      map(() => void 0),
      catchError(() => {
        this._fiatCurrencies.set(FIAT_FALLBACK);
        return of(void 0);
      }),
    );
  }

  loadCryptoSymbols() {
    if (this._cryptoSymbols().length > 0) return of(void 0);

    return this.http
      .get<{ symbol: string; price: string }[]>('https://api.binance.com/api/v3/ticker/price')
      .pipe(
        map((tickers) => {
          const symbols = tickers
            .filter((t) => t.symbol.endsWith('USDT'))
            .map((t) => t.symbol.slice(0, -4))
            .filter((s) => /^[A-Z]{2,6}$/.test(s))
            .sort();
          return symbols.length > 0 ? symbols : CRYPTO_FALLBACK;
        }),
        tap((symbols) => this._cryptoSymbols.set(symbols)),
        map(() => void 0),
        catchError(() => {
          this._cryptoSymbols.set(CRYPTO_FALLBACK);
          return of(void 0);
        }),
      );
  }
}
