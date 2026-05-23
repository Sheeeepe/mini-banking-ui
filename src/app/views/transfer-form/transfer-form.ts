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

@Component({
  selector: 'app-transfer-form',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule],
  templateUrl: './transfer-form.html',
})
export class TransferForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private queryClient = injectQueryClient();

  readonly accountId: number = Number(this.route.snapshot.paramMap.get('id'));

  readonly currency: WritableSignal<string> = signal(
    this.accountService.getCached(this.accountId)?.currency ?? 'EUR',
  );

  get currencySymbol(): string {
    return getCurrencySymbol(this.currency(), 'narrow');
  }

  targetAccountId: number | null = null;
  amount: number | null = null;
  description: string = '';
  error: WritableSignal<string> = signal('');

  transferMutation = injectMutation(() => ({
    mutationFn: () =>
      firstValueFrom(
        this.transactionService.transfer(
          this.accountId,
          this.targetAccountId!,
          this.amount!,
          this.description || undefined,
        ),
      ),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['transactions', this.accountId] });
      this.queryClient.invalidateQueries({ queryKey: ['balance', this.accountId] });
      this.queryClient.invalidateQueries({ queryKey: ['chart-transactions', this.accountId] });
      this.router.navigate(['/accounts', this.accountId]);
    },
    onError: (err: any) => {
      this.error.set(err.error?.error || 'Errore durante il trasferimento');
    },
  }));

  ngOnInit(): void {
    if (!this.accountService.getCached(this.accountId)) {
      this.accountService.getBalance(this.accountId).subscribe({
        next: (res) => this.currency.set(res.currency),
      });
    }
  }

  get isValid(): boolean {
    return (
      !!this.targetAccountId &&
      this.targetAccountId > 0 &&
      this.targetAccountId !== this.accountId &&
      !!this.amount &&
      this.amount > 0
    );
  }

  submit(): void {
    if (!this.isValid) return;
    this.error.set('');
    this.transferMutation.mutate();
  }

  cancel(): void {
    this.router.navigate(['/accounts', this.accountId]);
  }
}
