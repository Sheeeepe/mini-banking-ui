import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { TransactionService } from '../../../../services/transaction-service';

@Component({
  selector: 'app-recent-transactions',
  imports: [RouterLink, DatePipe, CurrencyPipe, MatButtonModule, MatIconModule],
  templateUrl: './recent-transactions.html',
  host: { class: 'block' },
})
export class RecentTransactions {
  accountId = input.required<number>();

  private transactionService = inject(TransactionService);

  transactionsQuery = injectQuery(() => ({
    queryKey: ['transactions', this.accountId(), { sort: 'created_at', order: 'desc', limit: 5 }],
    queryFn: () => firstValueFrom(
      this.transactionService.query(this.accountId(), { sort: 'created_at', order: 'desc', limit: 5 }),
    ),
    staleTime: 30_000,
  }));
}
