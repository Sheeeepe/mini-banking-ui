import {
  Component, input, AfterViewInit, OnDestroy,
  signal, ViewChild, ElementRef, inject, effect,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import Chart from 'chart.js/auto';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { TransactionService, TransactionQueryParams, TransactionListResult } from '../../../../services/transaction-service';
import { TransactionModel } from '../../../../models/transaction-model';

type TimeRange = '1d' | '7d' | '30d' | '90d' | 'all';

const RANGE_DAYS: Record<TimeRange, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90, 'all': Infinity };

@Component({
  selector: 'app-balance-chart',
  imports: [MatButtonToggleModule],
  templateUrl: './balance-chart.html',
  host: { class: 'block' },
})
export class BalanceChart implements AfterViewInit, OnDestroy {
  accountId = input.required<number>();
  currency = input.required<string>();

  @ViewChild('balanceChart') private balanceChartCanvas!: ElementRef<HTMLCanvasElement>;

  private transactionService = inject(TransactionService);
  private queryClient = injectQueryClient();
  private chart: Chart | null = null;
  private canvasReady = signal(false);

  timeRange = signal<TimeRange>('1d');

  chartQuery = injectQuery(() => {
    const range = this.timeRange();
    const accountId = this.accountId();
    const params = this.buildParams(range);

    return {
      queryKey: ['chart-transactions', accountId, range],
      queryFn: (): Promise<TransactionListResult> => {
        // If a broader range is already cached, filter client-side — no HTTP call
        const broader: TimeRange[] = (['all', '90d', '30d', '7d'] as TimeRange[])
          .filter(r => RANGE_DAYS[r] > RANGE_DAYS[range]);
        for (const r of broader) {
          const cached = this.queryClient.getQueryData<TransactionListResult>(
            ['chart-transactions', accountId, r],
          );
          if (cached) {
            return Promise.resolve({
              ...cached,
              transactions: this.filterToRange(cached.transactions, range),
            });
          }
        }
        return firstValueFrom(this.transactionService.query(accountId, params));
      },
      staleTime: 5 * 60_000,
    };
  });

  constructor() {
    effect(() => {
      const data = this.chartQuery.data();
      const ready = this.canvasReady();
      if (data && ready) this.drawChart(data.transactions);
    });
  }

  ngAfterViewInit(): void {
    this.canvasReady.set(true);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private buildParams(range: TimeRange): TransactionQueryParams {
    const params: TransactionQueryParams = { sort: 'created_at', order: 'asc', limit: 0 };
    if (range !== 'all') {
      const d = new Date();
      d.setDate(d.getDate() - RANGE_DAYS[range]);
      params.from = d.toISOString().split('T')[0];
    }
    return params;
  }

  private filterToRange(transactions: TransactionModel[], range: TimeRange): TransactionModel[] {
    if (range === 'all') return transactions;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
    return transactions.filter(t => new Date(t.created_at) >= cutoff);
  }

  private drawChart(transactions: TransactionModel[]): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (!this.balanceChartCanvas || transactions.length === 0) return;

    const ctx = this.balanceChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = transactions.map(t =>
      new Date(t.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
    );
    const values = transactions.map(t => t.balance_after);

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.12)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

    this.chart = new Chart(this.balanceChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Saldo',
          data: values,
          borderColor: '#4f46e5',
          backgroundColor: gradient,
          fill: true,
          tension: 0,
          pointRadius: 0,
          pointHitRadius: 10,
          segment: {
            borderColor: (ctx) => {
              if (ctx.p1DataIndex === undefined) return '#4f46e5';
              return transactions[ctx.p1DataIndex]?.type === 'deposit' ? '#16a34a' : '#dc2626';
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
        interaction: { intersect: false, mode: 'index' },
      },
    });
  }

  setTimeRange(range: TimeRange): void {
    this.timeRange.set(range);
  }
}
