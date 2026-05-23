import { Component, Input, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../../../services/transaction-service';
import { TransactionModel } from '../../../../models/transaction-model';

@Component({
  selector: 'app-recent-transactions',
  imports: [RouterLink, DatePipe, CurrencyPipe, MatButtonModule, MatIconModule],
  templateUrl: './recent-transactions.html',
  host: { class: 'block' },
})
export class RecentTransactions implements OnInit {
  @Input({ required: true }) accountId!: number;

  private transactionService: TransactionService = inject(TransactionService);

  transactions: WritableSignal<TransactionModel[]> = signal<TransactionModel[]>([]);
  currency: WritableSignal<string> = signal<string>('EUR');
  loading: WritableSignal<boolean> = signal(true);

  ngOnInit(): void {
    this.transactionService.query(this.accountId, {
      sort: 'created_at',
      order: 'desc',
      limit: 5,
    }).subscribe(res => {
      this.transactions.set(res.transactions);
      this.currency.set(res.currency);
      this.loading.set(false);
    });
  }
}
