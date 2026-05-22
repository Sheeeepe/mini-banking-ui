import { Component, computed, effect, inject, Input, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AccountService } from '../../../../services/account-service';
import { CurrencyService } from '../../../../services/currency.service';

@Component({
  selector: 'app-conversion-card',
  imports: [
    FormsModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule,
    CurrencyPipe, DecimalPipe,
  ],
  templateUrl: './conversion-card.html',
  host: { class: 'block' },
})
export class ConversionCard implements OnInit {
  @Input({ required: true }) accountId!: number;
  @Input({ required: true }) balance!: number;
  @Input({ required: true }) currency!: string;

  private accountService = inject(AccountService);
  private currencyService = inject(CurrencyService);

  converting = signal(false);
  conversionResult = signal<{ type: string; to: string; amount: number; rate?: number } | null>(null);
  conversionError = signal('');
  fiatLoading = signal(false);

  selectedFiatCurrency = signal('USD');
  selectedCryptoCurrency = signal('BTC');

  fiatCurrencies = computed(() =>
    this.currencyService.fiatCurrencies().filter(c => c !== this.currency)
  );

  protected readonly cryptoSymbols = this.currencyService.cryptoSymbols;

  constructor() {
    effect(() => {
      const available = this.fiatCurrencies();
      if (available.length > 0 && !available.includes(this.selectedFiatCurrency())) {
        this.selectedFiatCurrency.set(available[0]);
      }
    });
  }

  ngOnInit(): void {
    this.fiatLoading.set(true);
    this.currencyService.loadFiatCurrencies().subscribe({
      next: () => this.fiatLoading.set(false),
    });
  }

  convertFiat(): void {
    this.converting.set(true);
    this.conversionError.set('');
    this.conversionResult.set(null);
    this.accountService.convertFiat(this.accountId, this.selectedFiatCurrency()).subscribe({
      next: (res) => {
        this.conversionResult.set({ type: 'fiat', to: res.to_currency, amount: res.converted_balance, rate: res.rate });
        this.converting.set(false);
      },
      error: () => {
        this.conversionError.set('Conversione fiat non disponibile');
        this.converting.set(false);
      },
    });
  }

  convertCrypto(): void {
    this.converting.set(true);
    this.conversionError.set('');
    this.conversionResult.set(null);
    this.accountService.convertCrypto(this.accountId, this.selectedCryptoCurrency()).subscribe({
      next: (res) => {
        this.conversionResult.set({ type: 'crypto', to: res.to_crypto, amount: res.converted_amount });
        this.converting.set(false);
      },
      error: () => {
        this.conversionError.set('Conversione crypto non disponibile');
        this.converting.set(false);
      },
    });
  }
}
