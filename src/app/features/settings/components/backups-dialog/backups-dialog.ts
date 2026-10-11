import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { ConfirmWordDialogComponent } from '@app/core/components/dialog/confirm-word-dialog.component';
import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { DataTable } from '@app/core/components/table/data-table';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { I18nService } from '@app/core/i18n/i18n.service';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { I18nDate } from '@app/core/i18n/pipes/date.pipe';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { SettingsService } from '@app/features/settings/services/settings.service';

import type { DataColumn } from '@app/core/components/table/data-table.model';
import type { BackupEntry } from '@app/core/data/data-backups';

export interface BackupsDialogData {
  readonly allowSave?: boolean;
}

function currentDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-backups-dialog',
  imports: [DialogShellComponent, DataTable, Icon, T, I18nDate, TippyDirective],
  templateUrl: './backups-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupsDialogComponent implements OnInit {
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly dialog = inject(Dialog);
  private readonly settings = inject(SettingsService);
  private readonly toastr = inject(ToastrService);
  private readonly i18n = inject(I18nService);
  private readonly data = inject<BackupsDialogData>(DIALOG_DATA, { optional: true });

  protected readonly allowSave = this.data?.allowSave !== false;
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly restoring = signal<string | null>(null);
  protected readonly deleting = signal<string | null>(null);
  protected readonly deletingAll = signal(false);
  protected readonly backups = signal<readonly BackupEntry[]>([]);
  protected readonly today = currentDateString();

  private readonly dateCell = viewChild<TemplateRef<unknown>>('dateCell');
  private readonly timeCell = viewChild<TemplateRef<unknown>>('timeCell');
  private readonly actionsCell = viewChild<TemplateRef<unknown>>('actionsCell');

  protected readonly columns = computed<readonly DataColumn<BackupEntry>[]>(() => [
    {
      key: 'date',
      labelKey: 'settings.backups.dateColumn',
      sortable: true,
      cellTemplate: this.dateCell() ?? undefined,
    },
    {
      key: 'profileName',
      labelKey: 'settings.backups.profileColumn',
      searchable: true,
    },
    {
      key: 'savedAt',
      labelKey: 'settings.backups.timeColumn',
      sortable: true,
      cellTemplate: this.timeCell() ?? undefined,
    },
    {
      key: 'actions',
      labelKey: 'common.actions',
      align: 'right',
      widthClass: 'w-44',
      cellTemplate: this.actionsCell() ?? undefined,
    },
  ]);

  ngOnInit(): void {
    void this.load();
  }

  protected async onSave(): Promise<void> {
    this.saving.set(true);

    try {
      await this.settings.saveBackup();
      this.backups.set(await this.settings.listBackups());
      this.toastr.success('settings.backups.saveSuccess');
    } catch {
      this.toastr.error('settings.backups.saveError');
    } finally {
      this.saving.set(false);
    }
  }

  protected onRestore(entry: BackupEntry): void {
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('settings.backups.restoreConfirmTitle'),
        message: this.i18n.t('settings.backups.restoreConfirmMessage'),
        confirmLabel: this.i18n.t('settings.backups.restore'),
        cancelLabel: this.i18n.t('common.cancel'),
        variant: 'danger',
      },
    });

    dialogRef.closed.subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      this.restoring.set(entry.id);

      try {
        await this.settings.restoreBackup(entry.id);
        this.toastr.success('settings.backups.restoreSuccess');
        this.dialogRef.close(true);
      } catch {
        this.toastr.error('settings.backups.restoreError');
      } finally {
        this.restoring.set(null);
      }
    });
  }

  protected onDelete(entry: BackupEntry): void {
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('settings.backups.deleteConfirmTitle'),
        message: this.i18n.t('settings.backups.deleteConfirmMessage'),
        confirmLabel: this.i18n.t('common.delete'),
        cancelLabel: this.i18n.t('common.cancel'),
        variant: 'danger',
      },
    });

    dialogRef.closed.subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      this.deleting.set(entry.id);

      try {
        await this.settings.deleteBackup(entry.id);
        this.backups.set(await this.settings.listBackups());
        this.toastr.success('settings.backups.deleteSuccess');
      } catch {
        this.toastr.error('settings.backups.deleteError');
      } finally {
        this.deleting.set(null);
      }
    });
  }

  protected onDeleteAll(): void {
    const dialogRef = this.dialog.open<boolean>(ConfirmWordDialogComponent, {
      data: {
        title: this.i18n.t('settings.backups.deleteAllConfirmTitle'),
        message: this.i18n.t('settings.backups.deleteAllConfirmMessage'),
        confirmWord: this.i18n.t('settings.backups.deleteAllConfirmWord'),
        confirmLabel: this.i18n.t('settings.backups.deleteAll'),
        cancelLabel: this.i18n.t('common.cancel'),
      },
    });

    dialogRef.closed.subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      this.deletingAll.set(true);

      try {
        await this.settings.deleteAllBackups();
        this.backups.set([]);
        this.toastr.success('settings.backups.deleteAllSuccess');
      } catch {
        this.toastr.error('settings.backups.deleteError');
      } finally {
        this.deletingAll.set(false);
      }
    });
  }

  protected close(): void {
    this.dialogRef.close(false);
  }

  private async load(): Promise<void> {
    try {
      this.backups.set(await this.settings.listBackups());
    } catch {
      this.toastr.error('settings.backups.loadError');
    } finally {
      this.loading.set(false);
    }
  }
}
