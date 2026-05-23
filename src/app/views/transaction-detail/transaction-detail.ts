import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { TransactionService } from '../../services/transaction-service';
import { AccountService } from '../../services/account-service';

@Component({
  selector: 'app-transaction-detail',
  imports: [
    FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule,
    RouterLink, DatePipe, CurrencyPipe,
  ],
  templateUrl: './transaction-detail.html',
  styleUrl: './transaction-detail.css',
})
export class TransactionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private queryClient = injectQueryClient();

  accountId = 0;
  transactionId = 0;
  editDescription = '';
  editing: WritableSignal<boolean> = signal(false);
  mutationError: WritableSignal<string> = signal('');

  transactionQuery = injectQuery(() => ({
    queryKey: ['transaction', this.accountId, this.transactionId],
    queryFn: () => firstValueFrom(this.transactionService.getById(this.accountId, this.transactionId)),
    enabled: this.accountId > 0 && this.transactionId > 0,
    staleTime: 5 * 60_000,
  }));

  get currency(): string {
    return this.accountService.getCached(this.accountId)?.currency ?? 'EUR';
  }

  updateMutation = injectMutation(() => ({
    mutationFn: (description: string) =>
      firstValueFrom(
        this.transactionService.updateDescription(this.accountId, this.transactionId, description),
      ),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['transaction', this.accountId, this.transactionId] });
      this.queryClient.invalidateQueries({ queryKey: ['transactions', this.accountId] });
      this.editing.set(false);
      this.mutationError.set('');
    },
    onError: () => this.mutationError.set("Errore durante l'aggiornamento"),
  }));

  deleteMutation = injectMutation(() => ({
    mutationFn: () =>
      firstValueFrom(this.transactionService.delete(this.accountId, this.transactionId)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['transactions', this.accountId] });
      this.queryClient.invalidateQueries({ queryKey: ['balance', this.accountId] });
      this.queryClient.invalidateQueries({ queryKey: ['chart-transactions', this.accountId] });
      this.router.navigate(['/accounts', this.accountId, 'transactions']);
    },
    onError: () => this.mutationError.set("Errore durante l'eliminazione"),
  }));

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    this.transactionId = Number(this.route.snapshot.paramMap.get('tid'));
    if (!this.accountId || !this.transactionId) {
      this.router.navigate(['/accounts']);
    }
  }

  startEdit(): void {
    this.editing.set(true);
    this.editDescription = this.transactionQuery.data()?.description ?? '';
    this.mutationError.set('');
  }

  saveEdit(): void {
    this.updateMutation.mutate(this.editDescription);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editDescription = this.transactionQuery.data()?.description ?? '';
  }

  delete(): void {
    if (!confirm('Eliminare questa transazione definitivamente?')) return;
    this.deleteMutation.mutate();
  }
}
