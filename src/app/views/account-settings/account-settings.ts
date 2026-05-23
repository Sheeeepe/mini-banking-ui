import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccountService, BalanceData } from '../../services/account-service';
import { SelectedAccountService } from '../../services/selected-account.service';

@Component({
  selector: 'app-account-settings',
  imports: [DatePipe, FormsModule, RouterLink, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule],
  templateUrl: './account-settings.html',
})
export class AccountSettings {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private selectedAccountSvc = inject(SelectedAccountService);
  private queryClient = injectQueryClient();

  readonly accountId: number = Number(this.route.snapshot.paramMap.get('id'));

  ownerName: string = '';
  saveError: WritableSignal<string> = signal('');
  saveSuccess: WritableSignal<boolean> = signal(false);
  deleteError: WritableSignal<string> = signal('');

  accountQuery = injectQuery(() => ({
    queryKey: ['account', this.accountId],
    queryFn: () => firstValueFrom(this.accountService.getAccount(this.accountId)),
    enabled: this.accountId > 0,
    staleTime: 5 * 60_000,
  }));

  constructor() {
    // Pre-fill ownerName once the query resolves (data arrives asynchronously)
    effect(() => {
      const data = this.accountQuery.data();
      if (data && !this.ownerName) this.ownerName = data.owner_name;
    });
  }

  saveMutation = injectMutation(() => ({
    mutationFn: (name: string) =>
      firstValueFrom(this.accountService.updateAccount(this.accountId, name)),
    onSuccess: (res) => {
      // Update the balance cache in-place so the navbar reflects the new name immediately
      this.queryClient.setQueryData<BalanceData>(['balance', this.accountId], (old) =>
        old ? { ...old, owner_name: res.account.owner_name } : old,
      );
      this.queryClient.invalidateQueries({ queryKey: ['account', this.accountId] });
      this.ownerName = res.account.owner_name;
      this.saveSuccess.set(true);
      this.saveError.set('');
    },
    onError: () => this.saveError.set('Errore durante il salvataggio'),
  }));

  deleteMutation = injectMutation(() => ({
    mutationFn: () => firstValueFrom(this.accountService.deleteAccount(this.accountId)),
    onSuccess: () => {
      this.selectedAccountSvc.clear();
      this.queryClient.removeQueries({ queryKey: ['balance', this.accountId] });
      this.queryClient.removeQueries({ queryKey: ['account', this.accountId] });
      this.router.navigate(['/accounts']);
    },
    onError: (err: any) =>
      this.deleteError.set(err.error?.error || "Errore durante l'eliminazione"),
  }));

  get isDirty(): boolean {
    return this.ownerName.trim() !== (this.accountQuery.data()?.owner_name ?? '');
  }

  save(): void {
    if (!this.ownerName.trim()) return;
    this.saveSuccess.set(false);
    this.saveMutation.mutate(this.ownerName.trim());
  }

  delete(): void {
    if (!confirm("Eliminare definitivamente questo account? L'operazione non è reversibile.")) return;
    this.deleteMutation.mutate();
  }
}
