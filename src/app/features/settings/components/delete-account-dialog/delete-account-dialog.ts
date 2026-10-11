import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { I18nService } from '@app/core/i18n/i18n.service';
import { T } from '@app/core/i18n/pipes/t.pipe';

@Component({
  selector: 'app-delete-account-dialog',
  imports: [DialogShellComponent, Icon, T, FormsModule],
  templateUrl: './delete-account-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAccountDialogComponent {
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly i18n = inject(I18nService);

  protected readonly typed = signal('');
  protected readonly requiredWord = computed(() =>
    this.i18n.t('settings.deleteAccount.confirmWord'),
  );

  protected readonly canConfirm = computed(
    () => this.typed().trim().toLowerCase() === this.requiredWord().toLowerCase(),
  );

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    if (this.canConfirm()) {
      this.dialogRef.close(true);
    }
  }
}
