import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { AccountService } from './account-service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private accountService = inject(AccountService);

  public readonly API_ROUTES = {
    transaction: (accountId: string, transactionId: string) => `${this.accountService.API_ROUTES.account(accountId)}/transactions/${transactionId}`,
    deposit: (accountId: string) => `${this.accountService.API_ROUTES.account(accountId)}/deposit`,
    withdrawal: (accountId: string) => `${this.accountService.API_ROUTES.account(accountId)}/withdrawal`,
    allTransactions: (accountId: string) => `${this.accountService.API_ROUTES.account(accountId)}/transactions`,
    /* mancano endpoint delle transazioni in generale, non specificato user */
  };
}
