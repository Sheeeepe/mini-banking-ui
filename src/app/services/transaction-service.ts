import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { TransactionModel } from '../models/transaction-model';

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
  };

  getAll(accountId: number) {
    return this.http.get<{ account_id: number; currency: string; transactions: TransactionModel[] }>(
      this.API.transactions(accountId)
    );
  }

  getById(accountId: number, transactionId: number) {
    return this.http.get<TransactionModel>(this.API.transaction(accountId, transactionId));
  }

  deposit(accountId: number, amount: number, description?: string) {
    return this.http.post<{
      message: string;
      transaction_id: number;
      account_id: number;
      type: string;
      amount: number;
      description: string;
      balance_after: number;
    }>(this.API.deposits(accountId), { amount, description });
  }

  withdraw(accountId: number, amount: number, description?: string) {
    return this.http.post<{
      message: string;
      transaction_id: number;
      account_id: number;
      type: string;
      amount: number;
      description: string;
      balance_after: number;
    }>(this.API.withdrawals(accountId), { amount, description });
  }

  updateDescription(accountId: number, transactionId: number, description: string) {
    return this.http.put<{ message: string; transaction_id: number; description: string }>(
      this.API.transaction(accountId, transactionId),
      { description }
    );
  }

  delete(accountId: number, transactionId: number) {
    return this.http.delete<{ message: string; transaction_id: number }>(
      this.API.transaction(accountId, transactionId)
    );
  }
}
