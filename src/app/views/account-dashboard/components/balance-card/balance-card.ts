import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-balance-card',
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatIconModule],
  templateUrl: './balance-card.html',
})
export class BalanceCard {
  @Input({ required: true }) accountId!: number;
  @Input({ required: true }) ownerName!: string;
  @Input({ required: true }) balance!: number;
  @Input({ required: true }) currency!: string;
}
