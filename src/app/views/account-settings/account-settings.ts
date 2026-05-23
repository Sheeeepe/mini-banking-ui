import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AccountService, AccountDetails } from '../../services/account-service';
import { SelectedAccountService } from '../../services/selected-account.service';

@Component({
  selector: 'app-account-settings',
  imports: [DatePipe, FormsModule, RouterLink, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule],
  templateUrl: './account-settings.html',
})
export class AccountSettings implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private accountService: AccountService = inject(AccountService);
  private selectedAccountSvc: SelectedAccountService = inject(SelectedAccountService);

  readonly accountId: number = Number(this.route.snapshot.paramMap.get('id'));

  account: WritableSignal<AccountDetails | null> = signal<AccountDetails | null>(null);
  ownerName: string = '';

  saving: WritableSignal<boolean> = signal(false);
  saveError: WritableSignal<string> = signal('');
  saveSuccess: WritableSignal<boolean> = signal(false);

  deleting: WritableSignal<boolean> = signal(false);
  deleteError: WritableSignal<string> = signal('');

  loading: WritableSignal<boolean> = signal(true);
  loadError: WritableSignal<string> = signal('');

  ngOnInit(): void {
    this.accountService.getAccount(this.accountId).subscribe({
      next: (acc: AccountDetails) => {
        this.account.set(acc);
        this.ownerName = acc.owner_name;
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Account non trovato');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (!this.ownerName.trim()) return;
    this.saving.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);

    this.accountService.updateAccount(this.accountId, this.ownerName.trim()).subscribe({
      next: (res) => {
        this.account.set(res.account);
        this.ownerName = res.account.owner_name;
        this.accountService.patchCachedOwnerName(this.accountId, res.account.owner_name);
        this.saving.set(false);
        this.saveSuccess.set(true);
      },
      error: () => {
        this.saveError.set('Errore durante il salvataggio');
        this.saving.set(false);
      },
    });
  }

  delete(): void {
    if (!confirm('Eliminare definitivamente questo account? L\'operazione non è reversibile.')) return;
    this.deleting.set(true);
    this.deleteError.set('');

    this.accountService.deleteAccount(this.accountId).subscribe({
      next: () => {
        this.selectedAccountSvc.clear();
        this.router.navigate(['/accounts']);
      },
      error: (err) => {
        this.deleteError.set(err.error?.error || 'Errore durante l\'eliminazione');
        this.deleting.set(false);
      },
    });
  }

  get isDirty(): boolean {
    return this.ownerName.trim() !== (this.account()?.owner_name ?? '');
  }
}
