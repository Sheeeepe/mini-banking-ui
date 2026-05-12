import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AccountService } from '../../services/account-service';
import { TransactionService } from '../../services/transaction-service';
import { SelectedAccountService } from '../../services/selected-account.service';
import { TransactionModel } from '../../models/transaction-model';

@Component({
  selector: 'app-account-dashboard',
  imports: [
    MatButtonModule, MatIconModule, MatTabsModule,
    RouterLink, DatePipe, CurrencyPipe, DecimalPipe,
  ],
  templateUrl: './account-dashboard.html',
  styleUrl: './account-dashboard.css',
})
export class AccountDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private selectedAccountSvc = inject(SelectedAccountService);

  accountId = 0;
  ownerName = signal('');
  balance = signal<number>(0);
  currency = signal<string>('EUR');
  transactions = signal<TransactionModel[]>([]);
  error = signal('');
  loading = signal(true);

  // Conversion
  converting = signal(false);
  conversionResult = signal<{ type: string; to: string; amount: number; rate?: number } | null>(null);
  conversionError = signal('');

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.accountId) {
      this.router.navigate(['/accounts']);
      return;
    }
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.accountService.getBalance(this.accountId).subscribe({
      next: (res) => {
        this.balance.set(res.balance);
        this.currency.set(res.currency);
        this.ownerName.set(res.owner_name);
        this.selectedAccountSvc.select({
          id: this.accountId,
          owner_name: res.owner_name,
          currency: res.currency,
          balance: res.balance,
          created_at: new Date(),
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Account non trovato');
        this.loading.set(false);
      },
    });

    this.transactionService.getAll(this.accountId).subscribe({
      next: (res) => this.transactions.set(res.transactions),
    });
  }

  convertFiat(): void {
    this.converting.set(true);
    this.conversionError.set('');
    this.conversionResult.set(null);
    this.accountService.convertFiat(this.accountId, 'USD').subscribe({
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
    this.accountService.convertCrypto(this.accountId, 'BTC').subscribe({
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
