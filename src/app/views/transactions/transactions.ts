import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { TransactionService, TransactionQueryParams } from '../../services/transaction-service';

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
  private route = inject(ActivatedRoute);
  private transactionService = inject(TransactionService);

  accountId: WritableSignal<number> = signal(0);
  readonly pageSize = 10;

  filterType: WritableSignal<TypeFilter> = signal<TypeFilter>('all');
  filterSort: WritableSignal<SortField> = signal<SortField>('created_at');
  filterOrder: WritableSignal<SortOrder> = signal<SortOrder>('desc');
  currentPage: WritableSignal<number> = signal(1);

  transactionsQuery = injectQuery(() => {
    const type = this.filterType();
    const params: TransactionQueryParams = {
      sort: this.filterSort(),
      order: this.filterOrder(),
      page: this.currentPage(),
      limit: this.pageSize,
    };
    if (type !== 'all') params.type = type;

    return {
      queryKey: ['transactions', this.accountId(), params],
      queryFn: () => firstValueFrom(this.transactionService.query(this.accountId(), params)),
      enabled: this.accountId() > 0,
      placeholderData: keepPreviousData,
    };
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;
    this.accountId.set(id);
  }

  setType(type: TypeFilter): void { this.filterType.set(type); this.currentPage.set(1); }
  setSort(sort: SortField): void { this.filterSort.set(sort); this.currentPage.set(1); }
  toggleOrder(): void {
    this.filterOrder.update(o => o === 'desc' ? 'asc' : 'desc');
    this.currentPage.set(1);
  }
  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage(): void {
    const pages = this.transactionsQuery.data()?.pages ?? 1;
    if (this.currentPage() < pages) this.currentPage.update(p => p + 1);
  }
}
