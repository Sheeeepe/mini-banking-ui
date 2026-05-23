import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SelectedAccountService {
  readonly selectedId: WritableSignal<number | null> = signal<number | null>(null);

  select(id: number): void {
    this.selectedId.set(id);
  }

  clear(): void {
    this.selectedId.set(null);
  }
}
