import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { AccountService } from '../../services/account-service';
import { TransactionService } from '../../services/transaction-service';
import { SelectedAccountService } from '../../services/selected-account.service';
import { TransactionModel } from '../../models/transaction-model';
import { BalanceCard } from './components/balance-card/balance-card';
import { BalanceChart } from './components/balance-chart/balance-chart';
import { ConversionCard } from './components/conversion-card/conversion-card';
import { RecentTransactions } from './components/recent-transactions/recent-transactions';

@Component({
  selector: 'app-account-dashboard',
  imports: [
    RouterLink, MatButtonModule, MatIconModule,
    BalanceCard, BalanceChart, ConversionCard, RecentTransactions,
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
  balance = signal(0);
  currency = signal('EUR');
  transactions = signal<TransactionModel[]>([]);
  error = signal('');
  loading = signal(true);

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
    forkJoin({
      balance: this.accountService.getBalance(this.accountId),
      txs: this.transactionService.getAll(this.accountId),
    }).subscribe({
      next: ({ balance, txs }) => {
        this.ownerName.set(balance.owner_name);
        this.balance.set(balance.balance);
        this.currency.set(balance.currency);
        this.transactions.set(txs.transactions);
        this.selectedAccountSvc.select(this.accountId);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Account non trovato');
        this.loading.set(false);
      },
    });
  }
}
