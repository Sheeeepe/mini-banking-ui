import { Component, Input, AfterViewInit, OnDestroy, signal, ViewChild, ElementRef, WritableSignal, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import Chart from 'chart.js/auto';
import { TransactionService, TransactionQueryParams } from '../../../../services/transaction-service';
import { TransactionModel } from '../../../../models/transaction-model';

type TimeRange = '7d' | '30d' | '90d' | 'all';

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

  timeRange: WritableSignal<TimeRange> = signal<TimeRange>('all');
  private chart: Chart | null = null;
  private chartTransactions: TransactionModel[] = [];
  private chartLabels: string[] = [];
  private chartValues: number[] = [];

  ngAfterViewInit(): void {
    setTimeout(() => this.loadAndDraw());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private loadAndDraw(): void {
    const range: TimeRange = this.timeRange();
    const params: TransactionQueryParams = { sort: 'created_at', order: 'asc', limit: 100 };

    if (range !== 'all') {
      const days: number = ({ '7d': 7, '30d': 30, '90d': 90 } as Record<string, number>)[range];
      const d: Date = new Date();
      d.setDate(d.getDate() - days);
      params.from = d.toISOString().split('T')[0];
    }

    this.transactionService.query(this.accountId, params).subscribe(res => {
      this.chartTransactions = res.transactions;
      this.chartLabels = res.transactions.map(t =>
        new Date(t.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
      );
      this.chartValues = res.transactions.map(t => t.balance_after);
      this.initChart();
    });
  }

  private initChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (!this.balanceChartCanvas || this.chartLabels.length === 0) return;

    const ctx: CanvasRenderingContext2D | null = this.balanceChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 300);
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
          tension: 0,
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
