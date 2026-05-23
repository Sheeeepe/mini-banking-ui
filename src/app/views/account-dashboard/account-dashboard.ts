import { Component, computed, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../services/account-service';
import { SelectedAccountService } from '../../services/selected-account.service';
import { BalanceCard } from './components/balance-card/balance-card';
import { BalanceChart } from './components/balance-chart/balance-chart';
import { ConversionCard } from './components/conversion-card/conversion-card';
import { RecentTransactions } from './components/recent-transactions/recent-transactions';

@Component({
  selector: 'app-account-dashboard',
  imports: [
    RouterLink, MatButtonModule, MatIconModule,
    BalanceCard, BalanceChart, ConversionCard, RecentTransactions,
  ],
  templateUrl: './account-dashboard.html',
  styleUrl: './account-dashboard.css',
})
export class AccountDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private selectedAccountSvc = inject(SelectedAccountService);

  accountId: WritableSignal<number> = signal(0);

  balanceQuery = injectQuery(() => ({
    queryKey: ['balance', this.accountId()],
    queryFn: () => firstValueFrom(this.accountService.getBalance(this.accountId())),
    enabled: this.accountId() > 0,
  }));

  ownerName = computed(() => this.balanceQuery.data()?.owner_name ?? '');
  balance = computed(() => this.balanceQuery.data()?.balance ?? 0);
  currency = computed(() => this.balanceQuery.data()?.currency ?? 'EUR');

  constructor() {
    effect(() => {
      if (this.balanceQuery.isSuccess()) {
        this.selectedAccountSvc.select(this.accountId());
      }
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/accounts']);
      return;
    }
    this.accountId.set(id);
  }
}
