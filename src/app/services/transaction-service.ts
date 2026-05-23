import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { TransactionModel } from '../models/transaction-model';

type TransactionCache = { currency: string; transactions: TransactionModel[] };

type TransactionListResult = { account_id: number; currency: string; transactions: TransactionModel[] };

type TransactionMutationResult = {
  message: string;
  transaction_id: number;
  account_id: number;
  type: string;
  amount: number;
  description: string;
  balance_after: number;
};

type ApiRoutes = {
  transactions: (accountId: number) => string;
  transaction: (accountId: number, transactionId: number) => string;
  deposits: (accountId: number) => string;
  withdrawals: (accountId: number) => string;
};

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http: HttpClient = inject(HttpClient);
  private readonly apiUrl: string = environment.apiUrl;

  private readonly _cache = signal<Map<number, TransactionCache>>(new Map());

  private readonly API: ApiRoutes = {
    transactions: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/transactions`,
    transaction: (accountId: number, transactionId: number): string =>
      `${this.apiUrl}/accounts/${accountId}/transactions/${transactionId}`,
    deposits: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/deposits`,
    withdrawals: (accountId: number): string => `${this.apiUrl}/accounts/${accountId}/withdrawals`,
  };

  getAll(accountId: number): Observable<TransactionListResult> {
    const cached: TransactionCache | undefined = this._cache().get(accountId);
    if (cached) return of({ account_id: accountId, ...cached });

    return this.http.get<TransactionListResult>(
      this.API.transactions(accountId)
    ).pipe(
      tap(res => this._cache.update(m =>
        new Map(m).set(accountId, { currency: res.currency, transactions: res.transactions })
      ))
    );
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
}
