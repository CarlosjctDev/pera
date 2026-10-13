import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { DATA_BACKUPS } from '@app/core/data/data-backups';
import { DATA_STORE_BACKUP } from '@app/core/data/data-store-backup';
import { parseStoreSnapshot, StoreSnapshotError } from '@app/core/data/store-snapshot';

import type { BackupEntry } from '@app/core/data/data-backups';
import type {
  SnapshotProblem,
  SnapshotProblemCode,
  StoreSnapshot,
} from '@app/core/data/store-snapshot';

import { I18nService } from '@app/core/i18n/i18n.service';
import type { TranslationKey, TranslationParams } from '@app/core/i18n/i18n.keys';
import { APP_ROUTES } from '@app/core/routing/app.routing';
import { ImportProblemsDialogComponent } from '@app/features/settings/components/import-problems-dialog/import-problems-dialog';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { ScheduledMovementService } from '@app/features/transactions/services/scheduled-movement.service';
import { EnvironmentService } from '@env/enviroment.service';

const SNAPSHOT_TABLE_KEYS: Record<string, TranslationKey> = {
  profiles: 'settings.data.tables.profiles',
  categories: 'settings.data.tables.categories',
  transactions: 'settings.data.tables.transactions',
  relationshipTypes: 'settings.data.tables.relationshipTypes',
  contacts: 'settings.data.tables.contacts',
  accounts: 'settings.data.tables.accounts',
  scheduledMovements: 'settings.data.tables.scheduledMovements',
  attachments: 'settings.data.tables.attachments',
  notes: 'settings.data.tables.notes',
};

const SNAPSHOT_PROBLEM_KEYS: Record<SnapshotProblemCode, TranslationKey> = {
  invalidFormat: 'settings.data.importProblems.invalidFormat',
  notAppBackup: 'settings.data.importProblems.notAppBackup',
  unsupportedVersion: 'settings.data.importProblems.unsupportedVersion',
  invalidExportedAt: 'settings.data.importProblems.invalidExportedAt',
  invalidProfileName: 'settings.data.importProblems.invalidProfileName',
  tableNotArray: 'settings.data.importProblems.tableNotArray',
  duplicateId: 'settings.data.importProblems.duplicateId',
  multipleProfiles: 'settings.data.importProblems.multipleProfiles',
  invalidRow: 'settings.data.importProblems.invalidRow',
  invalidId: 'settings.data.importProblems.invalidId',
  invalidName: 'settings.data.importProblems.invalidName',
  invalidType: 'settings.data.importProblems.invalidType',
  invalidCategory: 'settings.data.importProblems.invalidCategory',
  invalidContact: 'settings.data.importProblems.invalidContact',
  invalidDate: 'settings.data.importProblems.invalidDate',
  invalidConcept: 'settings.data.importProblems.invalidConcept',
  invalidAmount: 'settings.data.importProblems.invalidAmount',
  invalidAccountType: 'settings.data.importProblems.invalidAccountType',
  invalidDueDate: 'settings.data.importProblems.invalidDueDate',
  invalidStatus: 'settings.data.importProblems.invalidStatus',
  invalidRecurrence: 'settings.data.importProblems.invalidRecurrence',
  invalidStartDate: 'settings.data.importProblems.invalidStartDate',
  invalidNextDate: 'settings.data.importProblems.invalidNextDate',
  invalidActive: 'settings.data.importProblems.invalidActive',
  invalidKind: 'settings.data.importProblems.invalidKind',
  invalidGender: 'settings.data.importProblems.invalidGender',
  invalidRelationshipType: 'settings.data.importProblems.invalidRelationshipType',
  invalidCurrency: 'settings.data.importProblems.invalidCurrency',
  invalidCreatedAt: 'settings.data.importProblems.invalidCreatedAt',
  missingCategoryReference: 'settings.data.importProblems.missingCategoryReference',
  missingContactReference: 'settings.data.importProblems.missingContactReference',
  missingIncomeReference: 'settings.data.importProblems.missingIncomeReference',
  missingRelationshipReference: 'settings.data.importProblems.missingRelationshipReference',
  invalidOwnerType: 'settings.data.importProblems.invalidOwnerType',
  invalidOwnerId: 'settings.data.importProblems.invalidOwnerId',
  invalidMimeType: 'settings.data.importProblems.invalidMimeType',
  invalidSize: 'settings.data.importProblems.invalidSize',
  invalidBase64: 'settings.data.importProblems.invalidBase64',
  invalidText: 'settings.data.importProblems.invalidText',
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  protected readonly environment = inject(EnvironmentService);
  private readonly store = inject(DATA_STORE_BACKUP);
  private readonly backups = inject(DATA_BACKUPS);
  private readonly profile = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly toastr = inject(ToastrService);
  private readonly i18n = inject(I18nService);
  private readonly scheduledMovements = inject(ScheduledMovementService);

  async deleteAccount(): Promise<void> {
    await this.store.wipe();
    this.profile.reset();
    await this.router.navigateByUrl(`/${APP_ROUTES.welcome.path}`);
  }

  async exportData(): Promise<void> {
    const snapshot = await this.store.exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.fileName(snapshot);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async importData(snapshot: StoreSnapshot): Promise<void> {
    await this.store.importSnapshot(snapshot);
  }

  async importFromFile(file: File): Promise<boolean> {
    const contents = await file.text();

    let snapshot: StoreSnapshot;

    try {
      snapshot = parseStoreSnapshot(JSON.parse(contents) as unknown);
    } catch (error) {
      const problems =
        error instanceof StoreSnapshotError
          ? error.problems.map((problem) => this.problemText(problem))
          : [this.i18n.t('settings.data.importProblems.invalidFormat')];

      this.dialog.open(ImportProblemsDialogComponent, {
        data: {
          title: this.i18n.t('settings.data.importProblemsTitle'),
          problems,
        },
      });
      this.toastr.error('settings.data.importInvalid');
      return false;
    }

    const confirmed = await this.confirmImport(snapshot);

    if (!confirmed) {
      return false;
    }

    try {
      await this.importData(snapshot);
      await this.profile.refresh();
      await this.scheduledMovements.generateDue();
      this.toastr.success('settings.data.importSuccess');
      return true;
    } catch {
      this.toastr.error('settings.data.importError');
      return false;
    }
  }

  async listBackups(): Promise<readonly BackupEntry[]> {
    return this.backups.list();
  }

  async deleteBackup(id: string): Promise<void> {
    await this.backups.remove(id);
  }

  async deleteAllBackups(): Promise<void> {
    await this.backups.clear();
  }

  async saveBackup(): Promise<BackupEntry> {
    const snapshot = await this.store.exportSnapshot();

    return this.backups.save(snapshot);
  }

  async restoreBackup(id: string): Promise<void> {
    const entry = await this.backups.get(id);

    if (entry === undefined) {
      throw new Error(`Backup ${id} not found`);
    }

    await this.store.importSnapshot(parseStoreSnapshot(entry.snapshot));
    await this.profile.refresh();
    await this.scheduledMovements.generateDue();
  }

  private confirmImport(snapshot: StoreSnapshot): Promise<boolean> {
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('settings.data.importConfirmTitle'),
        message: this.i18n.t('settings.data.importReplaceMessage', {
          name: snapshot.profileName ?? snapshot.tables.profiles[0]?.name ?? '—',
        }),
        confirmLabel: this.i18n.t('settings.data.import'),
        cancelLabel: this.i18n.t('common.cancel'),
        variant: 'danger',
      },
    });

    return new Promise<boolean>((resolve) => {
      dialogRef.closed.subscribe((value) => resolve(value === true));
    });
  }

  private problemText(problem: SnapshotProblem): string {
    const table = problem.table === undefined ? undefined : SNAPSHOT_TABLE_KEYS[problem.table];

    const params: TranslationParams = {
      ...(table !== undefined ? { table: this.i18n.t(table) } : {}),
      ...(problem.index !== undefined ? { index: problem.index } : {}),
      ...(problem.id !== undefined ? { id: problem.id } : {}),
      ...(problem.current !== undefined ? { current: problem.current } : {}),
      ...(problem.expected !== undefined ? { expected: problem.expected } : {}),
    };

    return this.i18n.t(SNAPSHOT_PROBLEM_KEYS[problem.code], params);
  }

  private fileName(snapshot: StoreSnapshot): string {
    const day = snapshot.exportedAt.slice(0, 10);

    return `${this.environment.appName}-${day}.json`;
  }
}
