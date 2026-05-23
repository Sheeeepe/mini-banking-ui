import { Component, computed, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectedAccountService } from '../../services/selected-account.service';
import { AccountService, CachedAccount } from '../../services/account-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private selectedAccountSvc: SelectedAccountService = inject(SelectedAccountService);
  private accountService: AccountService = inject(AccountService);

  protected selectedAccount: Signal<CachedAccount | null> = computed(() => {
    const id: number | null = this.selectedAccountSvc.selectedId();
    return id !== null ? this.accountService.getCached(id) : null;
  });
}
