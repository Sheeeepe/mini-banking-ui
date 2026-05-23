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

@Component({
  selector: 'app-transfer-form',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule],
  templateUrl: './transfer-form.html',
})
export class TransferForm implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private transactionService: TransactionService = inject(TransactionService);
  private accountService: AccountService = inject(AccountService);

  readonly accountId: number = Number(this.route.snapshot.paramMap.get('id'));

  readonly currency: WritableSignal<string> = signal(
    this.accountService.getCached(this.accountId)?.currency ?? 'EUR'
  );

  get currencySymbol(): string {
    return getCurrencySymbol(this.currency(), 'narrow');
  }

  targetAccountId: number | null = null;
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

  get isValid(): boolean {
    return !!this.targetAccountId &&
      this.targetAccountId > 0 &&
      this.targetAccountId !== this.accountId &&
      !!this.amount &&
      this.amount > 0;
  }

  submit(): void {
    if (!this.isValid || !this.targetAccountId || !this.amount) return;
    this.loading.set(true);
    this.error.set('');

    this.transactionService.transfer(
      this.accountId,
      this.targetAccountId,
      this.amount,
      this.description || undefined,
    ).subscribe({
      next: () => {
        this.transactionService.invalidate(this.accountId);
        this.accountService.invalidateBalance(this.accountId);
        this.loading.set(false);
        this.router.navigate(['/accounts', this.accountId]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Errore durante il trasferimento');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/accounts', this.accountId]);
  }
}
