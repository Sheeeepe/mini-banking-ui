import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { TransactionModel } from '../models/transaction-model';

type TransactionCache = { currency: string; transactions: TransactionModel[] };

type TransactionListResult = {
  account_id: number;
  currency: string;
  total: number;
  page: number;
  limit: number;
  pages: number;
  transactions: TransactionModel[];
};

export type TransactionQueryParams = {
  type?: 'deposit' | 'withdrawal' | 'transfer';
  sort?: 'created_at' | 'amount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
};

type TransactionMutationResult = {
  message: string;
  transaction_id: number;
  account_id: number;
  type: string;
  amount: number;
  description: string;
  balance_after: number;
};

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = environment.apiUrl;

  private readonly _cache = signal<Map<number, TransactionCache>>(new Map());

  private readonly API = {
    transactions: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/transactions`,
    transaction: (accountId: number, transactionId: number): string =>
      `${this.apiUrl}/accounts/${accountId}/transactions/${transactionId}`,
    deposits: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/deposits`,
    withdrawals: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/withdrawals`,
    transfers: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/transfers`,
  };

  getAll(accountId: number): Observable<TransactionListResult> {
    const cached: TransactionCache | undefined = this._cache().get(accountId);
    if (cached) return of({
      account_id: accountId,
      currency: cached.currency,
      total: cached.transactions.length,
      page: 1,
      limit: cached.transactions.length,
      pages: 1,
      transactions: cached.transactions,
    });

    return this.http.get<TransactionListResult>(
      this.API.transactions(accountId)
    ).pipe(
      tap(res => this._cache.update(m =>
        new Map(m).set(accountId, { currency: res.currency, transactions: res.transactions })
      ))
    );
  }

  query(accountId: number, params: TransactionQueryParams = {}): Observable<TransactionListResult> {
    let httpParams: HttpParams = new HttpParams();
    if (params.type)  httpParams = httpParams.set('type',  params.type);
    if (params.sort)  httpParams = httpParams.set('sort',  params.sort);
    if (params.order) httpParams = httpParams.set('order', params.order);
    if (params.page)  httpParams = httpParams.set('page',  params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.from)  httpParams = httpParams.set('from',  params.from);
    if (params.to)    httpParams = httpParams.set('to',    params.to);
    return this.http.get<TransactionListResult>(this.API.transactions(accountId), { params: httpParams });
  }

  getById(accountId: number, transactionId: number): Observable<TransactionModel> {
    const cached: TransactionCache | undefined = this._cache().get(accountId);
    if (cached) {
      const tx: TransactionModel | undefined = cached.transactions.find(t => t.id === transactionId);
      if (tx) return of(tx);
    }
    return this.http.get<TransactionModel>(this.API.transaction(accountId, transactionId));
  }

  invalidate(accountId: number): void {
    this._cache.update((m: Map<number, TransactionCache>) => {
      const next: Map<number, TransactionCache> = new Map(m);
      next.delete(accountId);
      return next;
    });
  }

  deposit(accountId: number, amount: number, description?: string): Observable<TransactionMutationResult> {
    return this.http.post<TransactionMutationResult>(this.API.deposits(accountId), { amount, description });
  }

  withdraw(accountId: number, amount: number, description?: string): Observable<TransactionMutationResult> {
    return this.http.post<TransactionMutationResult>(this.API.withdrawals(accountId), { amount, description });
  }

  updateDescription(
    accountId: number,
    transactionId: number,
    description: string,
  ): Observable<{ message: string; transaction_id: number; description: string }> {
    return this.http.put<{ message: string; transaction_id: number; description: string }>(
      this.API.transaction(accountId, transactionId),
      { description }
    );
  }

  delete(accountId: number, transactionId: number): Observable<{ message: string; transaction_id: number }> {
    return this.http.delete<{ message: string; transaction_id: number }>(
      this.API.transaction(accountId, transactionId)
    );
  }

  transfer(
    accountId: number,
    targetAccountId: number,
    amount: number,
    description?: string,
  ): Observable<{ message: string; withdrawal: TransactionModel; deposit: TransactionModel }> {
    return this.http.post<{ message: string; withdrawal: TransactionModel; deposit: TransactionModel }>(
      this.API.transfers(accountId),
      { target_account_id: targetAccountId, amount, description },
    );
  }
}
