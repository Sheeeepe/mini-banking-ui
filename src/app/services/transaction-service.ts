import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { TransactionModel } from '../models/transaction-model';

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
  type?: 'deposit' | 'withdrawal';
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

  private readonly _queryCache = signal<Map<string, TransactionListResult>>(new Map());

  private readonly API = {
    transactions: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/transactions`,
    transaction: (accountId: number, transactionId: number): string =>
      `${this.apiUrl}/accounts/${accountId}/transactions/${transactionId}`,
    deposits: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/deposits`,
    withdrawals: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/withdrawals`,
    transfers: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/transfers`,
  };

  private queryKey(accountId: number, params: TransactionQueryParams): string {
    return `${accountId}|${params.type ?? ''}|${params.sort ?? ''}|${params.order ?? ''}|${params.page ?? ''}|${params.limit ?? ''}|${params.from ?? ''}|${params.to ?? ''}`;
  }

  query(accountId: number, params: TransactionQueryParams = {}): Observable<TransactionListResult> {
    const key: string = this.queryKey(accountId, params);
    const cached: TransactionListResult | undefined = this._queryCache().get(key);
    if (cached) return of(cached);

    let httpParams: HttpParams = new HttpParams();
    if (params.type)  httpParams = httpParams.set('type',  params.type);
    if (params.sort)  httpParams = httpParams.set('sort',  params.sort);
    if (params.order) httpParams = httpParams.set('order', params.order);
    if (params.page)  httpParams = httpParams.set('page',  params.page);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit);
    if (params.from)  httpParams = httpParams.set('from',  params.from);
    if (params.to)    httpParams = httpParams.set('to',    params.to);

    return this.http.get<TransactionListResult>(
      this.API.transactions(accountId), { params: httpParams }
    ).pipe(
      tap(res => this._queryCache.update(m => new Map(m).set(key, res)))
    );
  }

  getById(accountId: number, transactionId: number): Observable<TransactionModel> {
    return this.http.get<TransactionModel>(this.API.transaction(accountId, transactionId));
  }

  invalidate(accountId: number): void {
    this._queryCache.update((m: Map<string, TransactionListResult>) => {
      const next: Map<string, TransactionListResult> = new Map(m);
      const prefix: string = `${accountId}|`;
      for (const key of next.keys()) {
        if (key.startsWith(prefix)) next.delete(key);
      }
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
