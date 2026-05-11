import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  public readonly API_ROUTES = {
    /* la parte api va migliorata, mancano endpoint */
    account: (accountId: string) => `${this.apiUrl}/accounts/${accountId}`,
    allAccounts: () => `${this.apiUrl}/accounts`,
  };
}
