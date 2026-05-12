import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SelectedAccountService } from '../../services/selected-account.service';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Navbar {
  @Output() menuToggle = new EventEmitter<void>();
  protected selectedAccount = inject(SelectedAccountService).selected;
}
