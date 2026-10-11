import type { StoreSnapshot } from './store-snapshot';

import { InjectionToken } from '@angular/core';

export interface DataStoreBackup {
  readonly schemaVersion: number;
  exportSnapshot(): Promise<StoreSnapshot>;
  importSnapshot(snapshot: StoreSnapshot): Promise<void>;
  wipe(): Promise<void>;
}

export const DATA_STORE_BACKUP = new InjectionToken<DataStoreBackup>('DATA_STORE_BACKUP');
