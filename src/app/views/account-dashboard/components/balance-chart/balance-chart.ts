import { Component, Input, AfterViewInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import Chart from 'chart.js/auto';
import { TransactionModel } from '../../../../models/transaction-model';

type TimeRange = '7d' | '30d' | '90d' | 'all';

@Component({
  selector: 'app-balance-chart',
  imports: [MatButtonToggleModule],
  templateUrl: './balance-chart.html',
})
export class BalanceChart implements AfterViewInit, OnDestroy {
  @Input({ required: true }) transactions!: TransactionModel[];
  @Input({ required: true }) currency!: string;

  @ViewChild('balanceChart') balanceChartCanvas!: ElementRef<HTMLCanvasElement>;

  timeRange = signal<TimeRange>('all');
  private chart: Chart | null = null;
  private chartTransactions: TransactionModel[] = [];
  private chartLabels: string[] = [];
  private chartValues: number[] = [];

  ngAfterViewInit(): void {
    setTimeout(() => this.initChart());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

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

  private buildChartData(): void {
    const range = this.timeRange();
    let cutoff: Date | null = null;

    if (range !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
      const d = new Date();
      d.setDate(d.getDate() - days);
      cutoff = d;
    }

    this.chartTransactions = this.transactions
      .filter(t => !cutoff || new Date(t.created_at) >= cutoff)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    this.chartLabels = this.chartTransactions.map(t =>
      new Date(t.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    );
    this.chartValues = this.chartTransactions.map(t => t.balance_after);
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
}
