import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { T } from '@app/core/i18n/pipes/t.pipe';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  icon?: 'logout' | 'warning';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogShellComponent, T],
  template: `
    <app-dialog-shell [title]="data.title" [icon]="data.icon ?? 'warning'">
      <p class="text-sm leading-relaxed text-app-muted">
        {{ data.message }}
      </p>
      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          (click)="cancel()"
          class="rounded-xl bg-app-secondary px-4 py-2.5 text-sm font-semibold text-app-secondary-fg ring-1 ring-inset ring-app-border transition hover:bg-app-secondary-hover hover:text-app-fg"
        >
          {{ data.cancelLabel ?? ('common.cancel' | t) }}
        </button>
        <button
          type="button"
          (click)="confirm()"
          [class]="confirmClass()"
          class="rounded-xl px-4 py-2.5 text-sm font-semibold  shadow-lg transition focus:ring-2 focus:ring-app-primary focus:ring-offset-2 focus:ring-offset-app-surface focus:outline-none"
        >
          {{ data.confirmLabel ?? ('common.confirm' | t) }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(DialogRef<boolean>);
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);

  protected confirmClass(): string {
    return this.data.variant === 'danger'
      ? 'bg-red-500 shadow-red-500/30 hover:bg-red-600'
      : 'bg-app-primary shadow-black/10 hover:bg-app-primary-hover';
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
