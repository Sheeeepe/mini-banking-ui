import { getCurrencySymbol } from '@angular/common';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../services/transaction-service';
import { AccountService } from '../../services/account-service';

type OperationType = 'deposit' | 'withdraw';

@Component({
  selector: 'app-transaction-form',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule],
  templateUrl: './transaction-form.html',
})
export class TransactionForm implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private transactionService: TransactionService = inject(TransactionService);
  private accountService: AccountService = inject(AccountService);

  readonly type: OperationType = this.route.snapshot.data['type'];
  readonly accountId: number = Number(this.route.snapshot.paramMap.get('id'));

  get isDeposit(): boolean { return this.type === 'deposit'; }

  readonly currency: WritableSignal<string> = signal(this.accountService.getCached(this.accountId)?.currency ?? 'EUR');

  get currencySymbol(): string {
    return getCurrencySymbol(this.currency(), 'narrow');
  }

  amount: number | null = null;
  description: string = '';
  loading: WritableSignal<boolean> = signal(false);
  error: WritableSignal<string> = signal('');

  ngOnInit(): void {
    if (!this.accountService.getCached(this.accountId)) {
      this.accountService.getBalance(this.accountId).subscribe({
        next: (res) => this.currency.set(res.currency),
      });
    }
  }

  submit(): void {
    if (!this.amount || this.amount <= 0) return;
    this.loading.set(true);
    this.error.set('');

    const operation = this.isDeposit
      ? this.transactionService.deposit(this.accountId, this.amount, this.description || undefined)
      : this.transactionService.withdraw(this.accountId, this.amount, this.description || undefined);

    operation.subscribe({
      next: () => {
        this.transactionService.invalidate(this.accountId);
        this.accountService.invalidateBalance(this.accountId);
        this.loading.set(false);
        this.router.navigate(['/accounts', this.accountId]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || `Errore durante il ${this.isDeposit ? 'deposito' : 'prelievo'}`);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/accounts', this.accountId]);
  }
}
