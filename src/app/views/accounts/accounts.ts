import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { AccountService } from '../../services/account-service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-accounts',
  imports: [
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './accounts.html',
  styleUrl: './accounts.css',
})
export class Accounts {
  private accountService: AccountService = inject(AccountService);
  private router: Router = inject(Router);

  accountId: number = 1;
  ownerName: string = '';
  currency: string = 'EUR';
  error: WritableSignal<string> = signal('');
  creating: WritableSignal<boolean> = signal(false);

  readonly fiatCurrencies: string[] = inject(CurrencyService).fiatCurrencies;

  goToAccount(): void {
    if (this.accountId > 0) {
      this.router.navigate(['/accounts', this.accountId]);
    }
  }

  createAccount(): void {
    if (!this.ownerName || !this.currency) return;
    this.creating.set(true);
    this.error.set('');
    this.accountService.create(this.ownerName, this.currency).subscribe({
      next: (res) => {
        this.creating.set(false);
        this.router.navigate(['/accounts', res.accountId]);
      },
      error: () => {
        this.creating.set(false);
        this.error.set('Errore durante la creazione');
      },
    });
  }
}
