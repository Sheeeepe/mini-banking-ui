import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionModel } from '../../../../models/transaction-model';

@Component({
  selector: 'app-recent-transactions',
  imports: [RouterLink, DatePipe, CurrencyPipe, MatButtonModule, MatIconModule],
  templateUrl: './recent-transactions.html',
})
export class RecentTransactions {
  @Input({ required: true }) accountId!: number;
  @Input({ required: true }) transactions!: TransactionModel[];
  @Input({ required: true }) currency!: string;
}
