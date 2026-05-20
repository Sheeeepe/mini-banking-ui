import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SelectedAccountService } from '../../services/selected-account.service';

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

  protected selectedAccount = inject(SelectedAccountService).selected;

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
