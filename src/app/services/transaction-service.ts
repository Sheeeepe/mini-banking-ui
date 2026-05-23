import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { TransactionModel } from '../models/transaction-model';

export type TransactionListResult = {
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
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly API = {
    transactions: (accountId: number) => `${this.apiUrl}/accounts/${accountId}/transactions`,
    transaction: (accountId: number, transactionId: number) =>
      `${this.apiUrl}/accounts/${accountId}/transactions/${transactionId}`,
    deposits: (accountId: number) => `${this.apiUrl}/accounts/${accountId}/deposits`,
    withdrawals: (accountId: number) => `${this.apiUrl}/accounts/${accountId}/withdrawals`,
    transfers: (accountId: number) => `${this.apiUrl}/accounts/${accountId}/transfers`,
  };

  query(accountId: number, params: TransactionQueryParams = {}): Observable<TransactionListResult> {
    let httpParams = new HttpParams();
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.order) httpParams = httpParams.set('order', params.order);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    return this.http.get<TransactionListResult>(this.API.transactions(accountId), { params: httpParams });
  }

  getById(accountId: number, transactionId: number): Observable<TransactionModel> {
    return this.http.get<TransactionModel>(this.API.transaction(accountId, transactionId));
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
      { description },
    );
  }

  delete(
    accountId: number,
    transactionId: number,
  ): Observable<{ message: string; transaction_id: number }> {
    return this.http.delete<{ message: string; transaction_id: number }>(
      this.API.transaction(accountId, transactionId),
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
