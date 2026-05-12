import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SelectedAccountService } from './services/selected-account.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, Navbar,
    MatButtonModule, MatSidenavModule, MatListModule, MatIconModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected selectedAccount = inject(SelectedAccountService).selected;
}
