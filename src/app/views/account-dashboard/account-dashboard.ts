import { Component, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { forkJoin } from 'rxjs';
import Chart from 'chart.js/auto';
import { AccountService } from '../../services/account-service';
import { TransactionService } from '../../services/transaction-service';
import { SelectedAccountService } from '../../services/selected-account.service';
import { TransactionModel } from '../../models/transaction-model';

type TimeRange = '7d' | '30d' | '90d' | 'all';

@Component({
  selector: 'app-account-dashboard',
  imports: [
    MatButtonModule, MatIconModule, MatButtonToggleModule,
    RouterLink, DatePipe, CurrencyPipe, DecimalPipe,
  ],
  templateUrl: './account-dashboard.html',
  styleUrl: './account-dashboard.css',
})
export class AccountDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private selectedAccountSvc = inject(SelectedAccountService);

  accountId = 0;
  ownerName = signal('');
  balance = signal<number>(0);
  currency = signal<string>('EUR');
  transactions = signal<TransactionModel[]>([]);
  error = signal('');
  loading = signal(true);

  converting = signal(false);
  conversionResult = signal<{ type: string; to: string; amount: number; rate?: number } | null>(null);
  conversionError = signal('');

  timeRange = signal<TimeRange>('all');
  private chart: Chart | null = null;

  @ViewChild('balanceChart') balanceChartCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.accountId) {
      this.router.navigate(['/accounts']);
      return;
    }
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    forkJoin({
      balance: this.accountService.getBalance(this.accountId),
      txs: this.transactionService.getAll(this.accountId),
    }).subscribe({
      next: ({ balance, txs }) => {
        this.balance.set(balance.balance);
        this.currency.set(balance.currency);
        this.ownerName.set(balance.owner_name);
        this.selectedAccountSvc.select(this.accountId);
        this.transactions.set(txs.transactions);
        this.loading.set(false);
        setTimeout(() => this.initChart());
      },
      error: () => {
        this.error.set('Account non trovato');
        this.loading.set(false);
      },
    });
  }

  // ── Chart ──

  private chartTransactions: TransactionModel[] = [];
  private chartLabels: string[] = [];
  private chartValues: number[] = [];

  private initChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (!this.balanceChartCanvas) return;

    this.buildChartData();
    if (this.chartLabels.length === 0) return;

    const ctx = this.balanceChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.12)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

    this.chart = new Chart(this.balanceChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.chartLabels,
        datasets: [{
          label: 'Saldo',
          data: this.chartValues,
          borderColor: '#4f46e5',
          backgroundColor: gradient,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 10,
          segment: {
            borderColor: (ctx) => {
              if (ctx.p1DataIndex === undefined) return '#4f46e5';
              const tx = this.chartTransactions[ctx.p1DataIndex];
              return tx?.type === 'deposit' ? '#16a34a' : '#dc2626';
            },
          },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${Number(ctx.raw).toLocaleString('it-IT')} ${this.currency()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10, color: '#9ca3af', font: { size: 11 } },
          },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: {
              color: '#9ca3af',
              font: { size: 11 },
              callback: (v) => Number(v).toLocaleString('it-IT'),
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    });
  }

  private buildChartData(): void {
    const all = this.transactions();
    const range = this.timeRange();

    let cutoff: Date | null = null;
    if (range !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
      const d = new Date();
      d.setDate(d.getDate() - days);
      cutoff = d;
    }

    this.chartTransactions = all
      .filter((t) => !cutoff || new Date(t.created_at) >= cutoff)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    this.chartLabels = this.chartTransactions.map((t) => {
      const d = new Date(t.created_at);
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    });
    this.chartValues = this.chartTransactions.map((t) => t.balance_after);
  }

  setTimeRange(range: TimeRange): void {
    this.timeRange.set(range);
    this.buildChartData();
    if (!this.chart) {
      this.initChart();
      return;
    }
    this.chart.data.labels = this.chartLabels;
    this.chart.data.datasets[0].data = this.chartValues;
    this.chart.update();
  }

  // ── Conversion ──

  convertFiat(): void {
    this.converting.set(true);
    this.conversionError.set('');
    this.conversionResult.set(null);
    this.accountService.convertFiat(this.accountId, 'USD').subscribe({
      next: (res) => {
        this.conversionResult.set({ type: 'fiat', to: res.to_currency, amount: res.converted_balance, rate: res.rate });
        this.converting.set(false);
      },
      error: () => {
        this.conversionError.set('Conversione fiat non disponibile');
        this.converting.set(false);
      },
    });
  }

  convertCrypto(): void {
    this.converting.set(true);
    this.conversionError.set('');
    this.conversionResult.set(null);
    this.accountService.convertCrypto(this.accountId, 'BTC').subscribe({
      next: (res) => {
        this.conversionResult.set({ type: 'crypto', to: res.to_crypto, amount: res.converted_amount });
        this.converting.set(false);
      },
      error: () => {
        this.conversionError.set('Conversione crypto non disponibile');
        this.converting.set(false);
      },
    });
  }
}
