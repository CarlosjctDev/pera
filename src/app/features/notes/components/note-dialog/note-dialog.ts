import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, Dialog } from '@angular/cdk/dialog';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { I18nService } from '@app/core/i18n/i18n.service';
import { I18nDate } from '@app/core/i18n/pipes/date.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';

import { NOTE_MAX_LENGTH } from '../../models/note.model';
import { NoteService } from '../../services/note.service';

import type { Note, NoteOwnerType } from '../../models/note.model';

export interface NoteDialogData {
  readonly ownerType: NoteOwnerType;
  readonly ownerId: number;
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-note-dialog',
  imports: [DialogShellComponent, Icon, T, I18nDate, TippyDirective],
  templateUrl: './note-dialog.html',
  styles: [
    `
      .note-textarea {
        field-sizing: content;
        min-height: 2.75rem;
        max-height: 10rem;
        overflow-y: auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteDialogComponent {
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly noteService = inject(NoteService);
  private readonly toastr = inject(ToastrService);

  protected readonly data = inject<NoteDialogData>(DIALOG_DATA);

  protected readonly maxLength = NOTE_MAX_LENGTH;
  protected readonly maxDate = todayIso();

  protected readonly text = signal('');
  protected readonly date = signal(todayIso());
  protected readonly saving = signal(false);
  protected readonly textError = signal(false);
  protected readonly dateError = signal(false);

  protected readonly notes = computed(() =>
    this.noteService.byOwner(this.data.ownerType, this.data.ownerId),
  );

  constructor() {
    void this.noteService.load();
  }

  protected onText(event: Event): void {
    this.text.set((event.target as HTMLTextAreaElement).value);
    this.textError.set(false);
  }

  protected onDate(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
    this.dateError.set(false);
  }

  protected add(): void {
    const text = this.text().trim();
    const date = this.date();
    const invalidText = text === '';
    const invalidDate = date === '' || date > this.maxDate;

    this.textError.set(invalidText);
    this.dateError.set(invalidDate);

    if (invalidText || invalidDate) {
      return;
    }

    void this.save(text, date);
  }

  protected remove(note: Note): void {
    if (note.id === undefined) {
      return;
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('notes.deleteConfirmTitle'),
        message: this.i18n.t('notes.deleteConfirmMessage'),
        variant: 'danger',
      },
    });

    dialogRef.closed.subscribe((confirmed) => {
      if (!confirmed || note.id === undefined) {
        return;
      }

      void this.confirmDelete(note.id);
    });
  }

  private async save(text: string, date: string): Promise<void> {
    this.saving.set(true);

    try {
      await this.noteService.add({
        ownerType: this.data.ownerType,
        ownerId: this.data.ownerId,
        date,
        text,
      });
      this.text.set('');
      this.toastr.success('toasts.saved');
    } catch {
      this.toastr.error('toasts.saveError');
    } finally {
      this.saving.set(false);
    }
  }

  private async confirmDelete(id: number): Promise<void> {
    try {
      await this.noteService.delete(id);
      this.toastr.success('toasts.deleted');
    } catch {
      this.toastr.error('toasts.deleteError');
    }
  }
}
