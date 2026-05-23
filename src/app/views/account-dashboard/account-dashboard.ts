import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private accountService: AccountService = inject(AccountService);
  private selectedAccountSvc: SelectedAccountService = inject(SelectedAccountService);

  accountId: number = 0;
  ownerName: WritableSignal<string> = signal('');
  balance: WritableSignal<number> = signal(0);
  currency: WritableSignal<string> = signal('EUR');
  error: WritableSignal<string> = signal('');
  loading: WritableSignal<boolean> = signal(true);

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.accountId) {
      this.router.navigate(['/accounts']);
      return;
    }
    this.accountService.getBalance(this.accountId).subscribe({
      next: (balance) => {
        this.ownerName.set(balance.owner_name);
        this.balance.set(balance.balance);
        this.currency.set(balance.currency);
        this.selectedAccountSvc.select(this.accountId);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Account non trovato');
        this.loading.set(false);
      },
    });
  }
}
