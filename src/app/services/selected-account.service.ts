import { Injectable, signal } from '@angular/core';
import { AccountModel } from '../models/account-model';

@Injectable({ providedIn: 'root' })
export class SelectedAccountService {
  private readonly _selected = signal<AccountModel | null>(null);
  readonly selected = this._selected.asReadonly();

  select(account: AccountModel): void {
    this._selected.set(account);
  }

  clear(): void {
    this._selected.set(null);
  }
}
