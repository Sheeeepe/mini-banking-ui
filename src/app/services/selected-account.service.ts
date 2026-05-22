import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SelectedAccountService {
  readonly selectedId = signal<number | null>(null);

  select(id: number): void {
    this.selectedId.set(id);
  }

  clear(): void {
    this.selectedId.set(null);
  }
}
