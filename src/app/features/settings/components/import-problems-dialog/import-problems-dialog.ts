import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { T } from '@app/core/i18n/pipes/t.pipe';

export interface ImportProblemsDialogData {
  title: string;
  problems: readonly string[];
}

@Component({
  selector: 'app-import-problems-dialog',
  imports: [DialogShellComponent, Icon, T],
  templateUrl: './import-problems-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportProblemsDialogComponent {
  private readonly dialogRef = inject(DialogRef<void>);
  protected readonly data = inject<ImportProblemsDialogData>(DIALOG_DATA);

  protected close(): void {
    this.dialogRef.close();
  }
}
