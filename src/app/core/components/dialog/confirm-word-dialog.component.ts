import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { T } from '@app/core/i18n/pipes/t.pipe';

export interface ConfirmWordDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmWord: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
}

@Component({
  selector: 'app-confirm-word-dialog',
  imports: [DialogShellComponent, Icon, T, FormsModule],
  template: `
    <app-dialog-shell [title]="data.title" [icon]="'warning'">
      <p class="text-sm leading-relaxed text-app-muted">
        {{ data.message }}
      </p>

      <label class="mt-5 block text-sm font-medium text-app-surface-fg" for="confirm-word">
        {{ 'common.typeToConfirm' | t: { word: data.confirmWord } }}
      </label>
      <input
        id="confirm-word"
        name="confirm-word"
        type="text"
        autocomplete="off"
        autocapitalize="none"
        class="mt-1.5 w-full rounded-xl bg-app-secondary/50 px-3 py-2 text-sm text-app-fg ring-1 ring-inset ring-app-border transition focus:ring-2 focus:ring-app-primary focus:outline-none"
        [placeholder]="data.confirmWord"
        [ngModel]="typed()"
        (ngModelChange)="typed.set($event)"
        (keydown.enter)="$event.preventDefault(); confirm()"
      />

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          (click)="cancel()"
          class="rounded-xl bg-app-secondary px-4 py-2.5 text-sm font-semibold text-app-secondary-fg ring-1 ring-inset ring-app-border transition hover:bg-app-secondary-hover hover:text-app-fg"
        >
          {{ data.cancelLabel }}
        </button>
        <button
          type="button"
          (click)="confirm()"
          [disabled]="!canConfirm()"
          class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-app-surface focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <app-icon name="trash" class="h-4 w-4" />
          {{ data.confirmLabel }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmWordDialogComponent {
  private readonly dialogRef = inject(DialogRef<boolean>);
  protected readonly data = inject<ConfirmWordDialogData>(DIALOG_DATA);

  protected readonly typed = signal('');

  protected readonly canConfirm = computed(
    () => this.typed().trim().toLowerCase() === this.data.confirmWord.toLowerCase(),
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
