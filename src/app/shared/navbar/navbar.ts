import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectedAccountService } from '../../services/selected-account.service';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Navbar {
  @Output() menuToggle = new EventEmitter<void>();
  private router = inject(Router);
  private selectedAccountService = inject(SelectedAccountService);
  protected selectedAccount = this.selectedAccountService.selected;

  logout(): void {
    this.selectedAccountService.clear();
    this.router.navigate(['/home']);
  }
}
