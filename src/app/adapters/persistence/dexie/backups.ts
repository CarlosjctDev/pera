import { Injectable, inject } from '@angular/core';
import Dexie, { type Table } from 'dexie';

import type { BackupEntry, DataBackups } from '@app/core/data/data-backups';
import type { StoreSnapshot } from '@app/core/data/store-snapshot';
import { EnvironmentService } from '@env/enviroment.service';

interface StoredBackup {
  readonly date: string;
  readonly profileDate: string;
  readonly profileName: string;
  readonly savedAt: string;
  readonly snapshot: StoreSnapshot;
}

interface LegacyBackup {
  readonly date?: string;
  readonly profileDate?: string;
  readonly profileName?: string;
  readonly savedAt?: string;
  readonly snapshot?: StoreSnapshot;
}

function profileNameOf(snapshot: StoreSnapshot | undefined): string {
  return snapshot?.tables?.profiles?.[0]?.name ?? '';
}

function toStoredBackup(row: LegacyBackup): StoredBackup {
  const key = row.date ?? '';
  const profileName = row.profileName ?? profileNameOf(row.snapshot);
  const id = key.includes('#') ? key : `${key}#${profileName}`;

  return {
    date: id,
    profileDate: id.slice(0, 10),
    profileName,
    savedAt: row.savedAt ?? new Date(0).toISOString(),
    snapshot: row.snapshot as StoreSnapshot,
  };
}

function toBackupEntry(row: StoredBackup): BackupEntry {
  return {
    id: row.date,
    date: row.profileDate,
    profileName: row.profileName,
    savedAt: row.savedAt,
    snapshot: row.snapshot,
  };
}

function currentDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}

export class AppBackupsDatabase extends Dexie {
  backups!: Table<StoredBackup, string>;

  constructor() {
    const env = inject(EnvironmentService);
    super(env.appName + 'Backups');

    this.version(1).stores({
      backups: 'date',
    });

    this.version(2)
      .stores({
        backups: 'date, profileDate',
      })
      .upgrade(async (tx) => {
        const table = tx.table('backups') as Table<StoredBackup, string>;
        const rows = (await table.toArray()) as unknown as readonly LegacyBackup[];

        if (rows.length === 0) {
          return;
        }

        await table.clear();
        await table.bulkPut(rows.map(toStoredBackup));
      });
  }
}

@Injectable()
export class DexieDataBackups implements DataBackups {
  private readonly db = inject(AppBackupsDatabase);

  async list(): Promise<readonly BackupEntry[]> {
    const rows = await this.db.backups.orderBy('profileDate').reverse().toArray();

    return rows.map(toBackupEntry);
  }

  async save(snapshot: StoreSnapshot): Promise<BackupEntry> {
    const profileName = snapshot.tables.profiles[0]?.name ?? '';
    const date = currentDateString();

    const entry: StoredBackup = {
      date: `${date}#${profileName}`,
      profileDate: date,
      profileName,
      savedAt: new Date().toISOString(),
      snapshot,
    };

    await this.db.backups.put(entry);

    return toBackupEntry(entry);
  }

  async get(id: string): Promise<BackupEntry | undefined> {
    const row = await this.db.backups.get(id);

    return row === undefined ? undefined : toBackupEntry(row);
  }

  async remove(id: string): Promise<void> {
    await this.db.backups.delete(id);
  }

  async clear(): Promise<void> {
    await this.db.backups.clear();
  }
}
