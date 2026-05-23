import { Component, Input, AfterViewInit, OnDestroy, signal, ViewChild, ElementRef, WritableSignal, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import Chart from 'chart.js/auto';
import { TransactionService, TransactionQueryParams } from '../../../../services/transaction-service';
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
  @Input({ required: true }) accountId!: number;
  @Input({ required: true }) currency!: string;

  @ViewChild('balanceChart') balanceChartCanvas!: ElementRef<HTMLCanvasElement>;

  private transactionService: TransactionService = inject(TransactionService);

  timeRange: WritableSignal<TimeRange> = signal<TimeRange>('1d');
  loading: WritableSignal<boolean> = signal(false);

  private chart: Chart | null = null;
  private rawTransactions: TransactionModel[] = [];
  private loadedRange: TimeRange | null = null;

  ngAfterViewInit(): void {
    setTimeout(() => this.loadAndDraw());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private rangeCovers(loaded: TimeRange, requested: TimeRange): boolean {
    return RANGE_DAYS[loaded] >= RANGE_DAYS[requested];
  }

  private filterToRange(transactions: TransactionModel[], range: TimeRange): TransactionModel[] {
    if (range === 'all') return transactions;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
    return transactions.filter(t => new Date(t.created_at) >= cutoff);
  }

  private loadAndDraw(): void {
    const range = this.timeRange();

    if (this.loadedRange !== null && this.rangeCovers(this.loadedRange, range)) {
      this.drawChart(this.filterToRange(this.rawTransactions, range));
      return;
    }

    this.loading.set(true);

    const params: TransactionQueryParams = { sort: 'created_at', order: 'asc', limit: 0 };

    if (range !== 'all') {
      const d = new Date();
      d.setDate(d.getDate() - RANGE_DAYS[range]);
      params.from = d.toISOString().split('T')[0];
    }

    this.transactionService.query(this.accountId, params).subscribe(res => {
      this.rawTransactions = res.transactions;
      this.loadedRange = range;
      this.loading.set(false);
      this.drawChart(res.transactions);
    });
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
      new Date(t.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
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
              const tx = transactions[ctx.p1DataIndex];
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
              label: (ctx) => `${Number(ctx.raw).toLocaleString('it-IT')} ${this.currency}`,
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
    this.loadAndDraw();
  }
}
