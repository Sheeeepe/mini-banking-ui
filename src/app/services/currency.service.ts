import { Injectable } from '@angular/core';

export const FIAT_CURRENCIES: string[] = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK',
  'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK',
  'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN',
  'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR',
];

// Ordered by trading volume
export const CRYPTO_SYMBOLS: string[] = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP',
  'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC',
  'LTC', 'ATOM', 'UNI', 'XLM', 'NEAR',
  'BCH', 'APT', 'ALGO', 'FIL', 'ICP',
];

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  readonly fiatCurrencies: string[] = FIAT_CURRENCIES;
  readonly cryptoSymbols: string[] = CRYPTO_SYMBOLS;
}
