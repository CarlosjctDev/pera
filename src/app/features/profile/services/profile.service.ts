import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { PROFILE_REPOSITORY } from '@app/features/profile/data-access/profile.repository';

import type { Profile } from '@app/features/profile/data-access/profile.repository';
import { DEFAULT_CURRENCY } from '@app/features/profile/models/currency.model';

import type { CurrencyCode } from '@app/features/profile/models/currency.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly repository = inject(PROFILE_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _profile = signal<Profile | null>(null);
  private readonly _loading = signal(true);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly name = computed(() => this._profile()?.name ?? '');
  readonly currency = computed(() => this._profile()?.currency ?? DEFAULT_CURRENCY);
  readonly completed = computed(() => this._profile() !== null);

  constructor() {
    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.reload());
  }

  async load(): Promise<void> {
    await this.refresh();
    this._loading.set(false);
  }

  async refresh(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    try {
      this._profile.set((await this.repository.get()) ?? null);
    } catch {
      /* keep previous data */
    }
  }

  async complete(name: string, currency: CurrencyCode): Promise<void> {
    this._profile.set(await this.repository.save({ name, currency }));
  }

  reset(): void {
    this._profile.set(null);
  }
}
