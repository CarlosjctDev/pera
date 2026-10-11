import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { Dialog } from '@angular/cdk/dialog';

import { ToastrService } from '@app/core/components/toastr/toastr';
import { Icon } from '@app/core/components/icons/icon.component';
import { LanguageComponent } from '@app/core/components/language/language.component';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { SettingsService } from '@app/features/settings/services/settings.service';
import { DeleteAccountDialogComponent } from '@app/features/settings/components/delete-account-dialog/delete-account-dialog';
import { ImportSourceDialogComponent } from '@app/features/settings/components/import-source-dialog/import-source-dialog';
import { BackupsDialogComponent } from '@app/features/settings/components/backups-dialog/backups-dialog';
import { AboutDialogComponent } from '@app/features/settings/components/about-dialog/about-dialog';
import { PoliciesDialogComponent } from '@app/features/settings/components/policies-dialog/policies-dialog';

import type { ImportSource } from '@app/features/settings/components/import-source-dialog/import-source-dialog';
import { EnvironmentService } from '@env/enviroment.service';
import { TranslationParams } from '@app/core/i18n/i18n.keys';

@Component({
  selector: 'app-settings',
  imports: [Icon, LanguageComponent, T],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {  
  private readonly dialog = inject(Dialog);
  private readonly settingsService = inject(SettingsService);
  private readonly toastr = inject(ToastrService);
  private readonly enviroment = inject(EnvironmentService);
  
  protected readonly appNameParams = computed<TranslationParams>(() => ({
    appName: this.enviroment.appName,
  }));
  protected readonly importInput =
    viewChild.required<ElementRef<HTMLInputElement>>('importInput');

  protected readonly exporting = signal(false);
  protected readonly importing = signal(false);

  protected onExport(): void {
    this.exporting.set(true);

    void this.settingsService
      .exportData()
      .then(() => this.toastr.success('settings.data.exportSuccess'))
      .catch(() => this.toastr.error('settings.data.exportError'))
      .finally(() => this.exporting.set(false));
  }

  protected onImport(): void {
    const sourceRef = this.dialog.open<ImportSource>(ImportSourceDialogComponent);

    sourceRef.closed.subscribe((source) => {
      if (source === 'file') {
        this.importInput().nativeElement.click();
      } else if (source === 'backup') {
        this.onOpenBackups();
      }
    });
  }

  protected onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    input.value = '';
    this.importing.set(true);

    void this.settingsService.importFromFile(file).finally(() => this.importing.set(false));
  }

  protected onOpenBackups(): void {
    this.dialog.open(BackupsDialogComponent);
  }

  protected onDeleteAccount(): void {
    const dialogRef = this.dialog.open<boolean>(DeleteAccountDialogComponent);

    dialogRef.closed.subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      try {
        await this.settingsService.deleteAccount();
      } catch {
        this.toastr.error('toasts.deleteError');
      }
    });
  }

  protected onOpenAbout(): void {
    this.dialog.open(AboutDialogComponent);
  }

  protected onOpenPolicies(): void {
    this.dialog.open(PoliciesDialogComponent);
  }
}
