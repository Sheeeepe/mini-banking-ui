import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectedAccountService } from '../../services/selected-account.service';
import { AccountService } from '../../services/account-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private selectedAccountSvc = inject(SelectedAccountService);
  private accountService = inject(AccountService);

  protected selectedAccount = computed(() => {
    const id = this.selectedAccountSvc.selectedId();
    return id !== null ? this.accountService.getCached(id) : null;
  });
}
