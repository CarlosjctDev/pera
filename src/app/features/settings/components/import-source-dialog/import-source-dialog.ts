import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { T } from '@app/core/i18n/pipes/t.pipe';

export type ImportSource = 'file' | 'backup';

@Component({
  selector: 'app-import-source-dialog',
  imports: [DialogShellComponent, Icon, T],
  template: `
    <app-dialog-shell [title]="'welcome.importTitle' | t" [icon]="'database'" [margin]="'0 auto'">
      <div class="flex flex-col gap-2">
        <button
          type="button"
          (click)="choose('file')"
          class="flex w-full items-center gap-3 rounded-2xl bg-app-secondary/60 px-4 py-3 text-start ring-1 ring-inset ring-app-border transition hover:bg-app-secondary"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-primary/10 text-app-primary"
          >
            <app-icon name="save" class="h-5 w-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold">{{ 'welcome.importFile' | t }}</span>
            <span class="block text-xs text-app-muted">{{ 'welcome.importFileHint' | t }}</span>
          </span>
        </button>

        <button
          type="button"
          (click)="choose('backup')"
          class="flex w-full items-center gap-3 rounded-2xl bg-app-secondary/60 px-4 py-3 text-start ring-1 ring-inset ring-app-border transition hover:bg-app-secondary"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-primary/10 text-app-primary"
          >
            <app-icon name="database" class="h-5 w-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold">{{ 'welcome.importBackup' | t }}</span>
            <span class="block text-xs text-app-muted">{{ 'welcome.importBackupHint' | t }}</span>
          </span>
        </button>
      </div>
    </app-dialog-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportSourceDialogComponent {
  private readonly dialogRef = inject(DialogRef<ImportSource>);

  protected choose(source: ImportSource): void {
    this.dialogRef.close(source);
  }
}
