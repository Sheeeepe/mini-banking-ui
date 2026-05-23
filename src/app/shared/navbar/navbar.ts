import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Output, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectedAccountService } from '../../services/selected-account.service';
import { AccountService, CachedAccount } from '../../services/account-service';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Navbar {
  @Output() menuToggle: EventEmitter<void> = new EventEmitter<void>();

  private router: Router = inject(Router);
  private selectedAccountSvc: SelectedAccountService = inject(SelectedAccountService);
  private accountService: AccountService = inject(AccountService);

  protected selectedAccount: Signal<CachedAccount | null> = computed(() => {
    const id: number | null = this.selectedAccountSvc.selectedId();
    return id !== null ? this.accountService.getCached(id) : null;
  });

  logout(): void {
    this.selectedAccountSvc.clear();
    this.router.navigate(['/home']);
  }
}
