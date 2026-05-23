import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransactionService, TransactionQueryParams } from '../../services/transaction-service';
import { TransactionModel } from '../../models/transaction-model';

type TypeFilter = 'all' | 'deposit' | 'withdrawal';
type SortField  = 'created_at' | 'amount';
type SortOrder  = 'asc' | 'desc';

@Component({
  selector: 'app-transactions',
  imports: [
    MatButtonModule, MatButtonToggleModule, MatIconModule, MatTooltipModule,
    RouterLink, DatePipe, CurrencyPipe,
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private transactionService: TransactionService = inject(TransactionService);

  transactions: WritableSignal<TransactionModel[]> = signal<TransactionModel[]>([]);
  currency: WritableSignal<string> = signal<string>('EUR');
  error: WritableSignal<string> = signal('');
  loading: WritableSignal<boolean> = signal(true);
  accountId: number = 0;

  readonly pageSize: number = 10;
  currentPage: WritableSignal<number> = signal(1);
  total: WritableSignal<number> = signal(0);
  totalPages: WritableSignal<number> = signal(1);

  filterType: WritableSignal<TypeFilter> = signal<TypeFilter>('all');
  filterSort: WritableSignal<SortField> = signal<SortField>('created_at');
  filterOrder: WritableSignal<SortOrder> = signal<SortOrder>('desc');

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.accountId) return;
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.loading.set(true);
    const params: TransactionQueryParams = {
      sort: this.filterSort(),
      order: this.filterOrder(),
      page: this.currentPage(),
      limit: this.pageSize,
    };
    const type: TypeFilter = this.filterType();
    if (type !== 'all') params.type = type;

    this.transactionService.query(this.accountId, params).subscribe({
      next: (res) => {
        this.transactions.set(res.transactions);
        this.currency.set(res.currency);
        this.total.set(res.total);
        this.totalPages.set(res.pages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossibile caricare le transazioni');
        this.loading.set(false);
      },
    });
  }

  setType(type: TypeFilter): void {
    this.filterType.set(type);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  setSort(sort: SortField): void {
    this.filterSort.set(sort);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  toggleOrder(): void {
    this.filterOrder.update((o: SortOrder) => o === 'desc' ? 'asc' : 'desc');
    this.currentPage.set(1);
    this.loadTransactions();
  }

  prevPage(): void {
    if (this.currentPage() <= 1) return;
    this.currentPage.update((p: number) => p - 1);
    this.loadTransactions();
  }

  nextPage(): void {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update((p: number) => p + 1);
    this.loadTransactions();
  }
}
