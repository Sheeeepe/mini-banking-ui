import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../services/transaction-service';
import { AccountService } from '../../services/account-service';

@Component({
  selector: 'app-deposit',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule],
  templateUrl: './deposit.html',
  styleUrl: './deposit.css',
})
export class Deposit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);

  accountId = Number(this.route.snapshot.paramMap.get('id'));
  amount: number | null = null;
  description = '';
  loading = signal(false);
  error = signal('');

  submit(): void {
    if (!this.amount || this.amount <= 0) return;
    this.loading.set(true);
    this.error.set('');
    this.transactionService.deposit(this.accountId, this.amount, this.description || undefined).subscribe({
      next: () => {
        this.transactionService.invalidate(this.accountId);
        this.accountService.invalidateBalance(this.accountId);
        this.loading.set(false);
        this.router.navigate(['/accounts', this.accountId]);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Errore durante il deposito. Riprova.');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/accounts', this.accountId]);
  }
}
