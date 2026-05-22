import { Component, computed, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SelectedAccountService } from '../../services/selected-account.service';
import { AccountService } from '../../services/account-service';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink, RouterLinkActive,
    MatSidenavModule, MatListModule, MatIconModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input({ required: true }) isMobile!: boolean;
  @Output() navClick = new EventEmitter<void>();

  @ViewChild('sidenav') sidenav!: MatSidenav;

  private selectedAccountSvc = inject(SelectedAccountService);
  private accountService = inject(AccountService);

  protected selectedAccount = computed(() => {
    const id = this.selectedAccountSvc.selectedId();
    return id !== null ? this.accountService.getCached(id) : null;
  });

  onLinkClick(): void {
    this.navClick.emit();
    if (this.isMobile) {
      this.sidenav.close();
    }
  }

  toggle(): void {
    this.sidenav?.toggle();
  }
}
