import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { SelectedAccountService } from '../../services/selected-account.service';
import { AccountService, CachedAccount } from '../../services/account-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Navbar {
  @Output() menuToggle: EventEmitter<void> = new EventEmitter<void>();

  private router = inject(Router);
  private selectedAccountSvc = inject(SelectedAccountService);
  private accountService = inject(AccountService);
  private queryClient = injectQueryClient();

  private selectedId = computed(() => this.selectedAccountSvc.selectedId());

  selectedAccountQuery = injectQuery(() => ({
    queryKey: ['balance', this.selectedId() ?? 0],
    queryFn: () => firstValueFrom(this.accountService.getBalance(this.selectedId()!)),
    enabled: this.selectedId() !== null,
    staleTime: 30_000,
  }));

  protected selectedAccount = computed((): CachedAccount | null => {
    const id = this.selectedId();
    if (!id) return null;
    const data = this.selectedAccountQuery.data();
    if (!data) return null;
    return { id: data.account_id, owner_name: data.owner_name, currency: data.currency, balance: data.balance };
  });

  logout(): void {
    this.selectedAccountSvc.clear();
    this.queryClient.clear();
    this.router.navigate(['/home']);
  }
}
