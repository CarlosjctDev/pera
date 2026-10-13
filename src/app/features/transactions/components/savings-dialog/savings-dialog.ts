import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { SavingsEditor } from '@app/features/transactions/components/savings-editor/savings-editor';
import { emptySavingDraft } from '@app/features/transactions/models/saving-draft.model';

import type { SavingDraft } from '@app/features/transactions/models/saving-draft.model';

export interface SavingsDialogData {
  readonly max: number;
}

@Component({
  selector: 'app-savings-dialog',
  imports: [DialogShellComponent, Icon, T, I18nCurrency, SavingsEditor],
  templateUrl: './savings-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsDialogComponent {
  private readonly dialogRef =
    inject<DialogRef<readonly SavingDraft[] | undefined>>(DialogRef);
  private readonly profile = inject(ProfileService);
  private readonly editor = viewChild.required(SavingsEditor);

  protected readonly data = inject<SavingsDialogData>(DIALOG_DATA);
  protected readonly currency = this.profile.currency;
  protected readonly drafts = signal<readonly SavingDraft[]>([emptySavingDraft()]);

  protected save(): void {
    const drafts = this.drafts();

    if (drafts.length === 0) {
      this.dialogRef.close(undefined);
      return;
    }

    if (!this.editor().validate()) {
      return;
    }

    this.dialogRef.close(drafts);
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
