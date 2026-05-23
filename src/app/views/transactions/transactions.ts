import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../services/transaction-service';
import { TransactionModel } from '../../models/transaction-model';

@Component({
  selector: 'app-transactions',
  imports: [
    MatButtonModule, MatIconModule,
    RouterLink, DatePipe, CurrencyPipe,
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private transactionService: TransactionService = inject(TransactionService);

  protected Math: typeof Math = Math;

  transactions: WritableSignal<TransactionModel[]> = signal<TransactionModel[]>([]);
  currency: WritableSignal<string> = signal<string>('EUR');
  error: WritableSignal<string> = signal('');
  loading: WritableSignal<boolean> = signal(true);
  accountId: number = 0;

  pageSize: number = 10;
  currentPage: WritableSignal<number> = signal(1);

  totalPages: Signal<number> = computed(() => Math.max(1, Math.ceil(this.transactions().length / this.pageSize)));

  paginatedTransactions: Signal<TransactionModel[]> = computed(() => {
    const start: number = (this.currentPage() - 1) * this.pageSize;
    return this.transactions().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.accountId) return;
    this.transactionService.getAll(this.accountId).subscribe({
      next: (res) => {
        this.transactions.set(res.transactions);
        this.currency.set(res.currency);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossibile caricare le transazioni');
        this.loading.set(false);
      },
    });
  }

  prevPage(): void {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }
}
