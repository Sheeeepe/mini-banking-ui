import { getCurrencySymbol } from '@angular/common';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { TransactionService } from '../../services/transaction-service';
import { AccountService } from '../../services/account-service';

type OperationType = 'deposit' | 'withdraw';

@Component({
  selector: 'app-transaction-form',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule],
  templateUrl: './transaction-form.html',
})
export class TransactionForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private queryClient = injectQueryClient();

  readonly type: OperationType = this.route.snapshot.data['type'];
  readonly accountId: number = Number(this.route.snapshot.paramMap.get('id'));

  get isDeposit(): boolean { return this.type === 'deposit'; }

  readonly currency: WritableSignal<string> = signal(
    this.accountService.getCached(this.accountId)?.currency ?? 'EUR',
  );

  get currencySymbol(): string {
    return getCurrencySymbol(this.currency(), 'narrow');
  }

  amount: number | null = null;
  description: string = '';
  error: WritableSignal<string> = signal('');

  operationMutation = injectMutation(() => ({
    mutationFn: () => {
      const op = this.isDeposit
        ? this.transactionService.deposit(this.accountId, this.amount!, this.description || undefined)
        : this.transactionService.withdraw(this.accountId, this.amount!, this.description || undefined);
      return firstValueFrom(op);
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['transactions', this.accountId] });
      this.queryClient.invalidateQueries({ queryKey: ['balance', this.accountId] });
      this.queryClient.invalidateQueries({ queryKey: ['chart-transactions', this.accountId] });
      this.router.navigate(['/accounts', this.accountId]);
    },
    onError: (err: any) => {
      this.error.set(err.error?.error || `Errore durante il ${this.isDeposit ? 'deposito' : 'prelievo'}`);
    },
  }));

  ngOnInit(): void {
    if (!this.accountService.getCached(this.accountId)) {
      this.accountService.getBalance(this.accountId).subscribe({
        next: (res) => this.currency.set(res.currency),
      });
    }
  }

  submit(): void {
    if (!this.amount || this.amount <= 0) return;
    this.error.set('');
    this.operationMutation.mutate();
  }

  cancel(): void {
    this.router.navigate(['/accounts', this.accountId]);
  }
}
