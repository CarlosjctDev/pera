import { InjectionToken } from '@angular/core';

import type { StoreSnapshot } from './store-snapshot';

export interface BackupEntry {
  readonly id: string;
  readonly date: string;
  readonly profileName: string;
  readonly savedAt: string;
  readonly snapshot: StoreSnapshot;
}

export interface DataBackups {
  list(): Promise<readonly BackupEntry[]>;
  save(snapshot: StoreSnapshot): Promise<BackupEntry>;
  get(id: string): Promise<BackupEntry | undefined>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export const DATA_BACKUPS = new InjectionToken<DataBackups>('DATA_BACKUPS');
