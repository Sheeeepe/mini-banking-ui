import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectedAccountService } from '../../services/selected-account.service';
import { AccountService } from '../../services/account-service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Navbar {
  @Output() menuToggle = new EventEmitter<void>();

  private selectedAccountSvc = inject(SelectedAccountService);
  private accountService = inject(AccountService);
  protected authService = inject(AuthService);

  protected selectedAccount = computed(() => {
    const id = this.selectedAccountSvc.selectedId();
    return id !== null ? this.accountService.getCached(id) : null;
  });

  logout(): void {
    this.authService.logout();
  }
}
