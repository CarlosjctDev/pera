import { Injectable, computed, signal } from '@angular/core';

export type PersistenceResult = 'persisted' | 'granted' | 'denied';

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly supported = signal(false);
  readonly usage = signal(0);
  readonly quota = signal(0);
  readonly persisted = signal(false);

  readonly canPersist = computed(
    () => this.supported() && typeof window !== 'undefined' && window.isSecureContext,
  );

  readonly free = computed(() => Math.max(0, this.quota() - this.usage()));
  readonly usedPercent = computed(() => {
    const quota = this.quota();

    return quota > 0 ? Math.min(100, (this.usage() / quota) * 100) : 0;
  });

  constructor() {
    this.supported.set(typeof navigator !== 'undefined' && 'storage' in navigator);
  }

  async init(): Promise<void> {
    if (!this.supported()) {
      return;
    }

    this.persisted.set(await navigator.storage.persisted());
    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.supported()) {
      return;
    }

    try {
      const [estimate, persisted] = await Promise.all([
        navigator.storage.estimate(),
        navigator.storage.persisted(),
      ]);

      const { usage = 0, quota = 0 } = estimate;

      this.usage.set(usage);
      this.quota.set(quota);
      this.persisted.set(persisted);
    } catch {
      this.usage.set(0);
      this.quota.set(0);
    }
  }

  async requestPersistence(): Promise<PersistenceResult> {
    if (!this.canPersist()) {
      return 'denied';
    }

    try {
      if (await navigator.storage.persisted()) {
        this.persisted.set(true);
        return 'persisted';
      }

      const granted = await navigator.storage.persist();

      this.persisted.set(granted ? true : await navigator.storage.persisted());
      return this.persisted() ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }
}
