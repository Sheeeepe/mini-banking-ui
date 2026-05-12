import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TransactionService } from '../../services/transaction-service';
import { TransactionModel } from '../../models/transaction-model';

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
  private transactionService = inject(TransactionService);
  private router = inject(Router);

  transaction = signal<TransactionModel | null>(null);
  editDescription = '';
  editing = signal(false);
  error = signal('');
  deleting = signal(false);

  accountId = 0;
  transactionId = 0;

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    this.transactionId = Number(this.route.snapshot.paramMap.get('tid'));
    if (!this.accountId || !this.transactionId) {
      this.router.navigate(['/accounts']);
      return;
    }
    this.load();
  }

  private load(): void {
    this.transactionService.getById(this.accountId, this.transactionId).subscribe({
      next: (t) => {
        this.transaction.set(t);
        this.editDescription = t.description;
      },
      error: () => this.error.set('Transazione non trovata'),
    });
  }

  startEdit(): void {
    this.editing.set(true);
    this.editDescription = this.transaction()?.description ?? '';
  }

  saveEdit(): void {
    this.transactionService.updateDescription(this.accountId, this.transactionId, this.editDescription).subscribe({
      next: () => {
        this.editing.set(false);
        this.load();
      },
      error: () => this.error.set('Errore durante l\'aggiornamento'),
    });
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editDescription = this.transaction()?.description ?? '';
  }

  delete(): void {
    if (!confirm('Eliminare questa transazione definitivamente?')) return;
    this.deleting.set(true);
    this.transactionService.delete(this.accountId, this.transactionId).subscribe({
      next: () => this.router.navigate(['/accounts', this.accountId, 'transactions']),
      error: () => {
        this.deleting.set(false);
        this.error.set('Errore durante l\'eliminazione');
      },
    });
  }
}
