import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DIALOG_DATA, Dialog } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { I18nDate } from '@app/core/i18n/pipes/date.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { AttachmentListDialogComponent } from '@app/features/attachments/components/attachment-list-dialog/attachment-list-dialog';
import { NoteDialogComponent } from '@app/features/notes/components/note-dialog/note-dialog';
import { NoteService } from '@app/features/notes/services/note.service';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { parseIsoDate } from '@app/features/transactions/utils/recurrence.utils';

import type { CalendarEvent } from '../../models/calendar-event.model';

export interface EventDetailData {
  readonly event: CalendarEvent;
  readonly badgeKey: TranslationKey;
  readonly icon: IconName;
  readonly amountClass: string;
  readonly dateLabelKey: TranslationKey;
  readonly categoryName?: string;
  readonly contactName?: string;
  readonly statusKey?: TranslationKey;
  readonly scheduled: boolean;
}

@Component({
  selector: 'app-event-detail-dialog',
  imports: [DialogShellComponent, Icon, T, I18nDate, I18nCurrency],
  templateUrl: './event-detail-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailDialogComponent {
  private readonly dialog = inject(Dialog);
  private readonly noteService = inject(NoteService);
  protected readonly data = inject<EventDetailData>(DIALOG_DATA);
  protected readonly profile = inject(ProfileService);

  protected readonly date = parseIsoDate(this.data.event.day);

  protected readonly notes = computed(() => {
    const { ownerType, ownerId } = this.data.event;

    if (ownerType === undefined || ownerId === undefined) {
      return [];
    }

    return this.noteService.byOwner(ownerType, ownerId);
  });

  constructor() {
    void this.noteService.load();
  }

  protected viewAttachments(): void {
    const { ownerType, ownerId } = this.data.event;

    if (ownerType === undefined || ownerId === undefined) {
      return;
    }

    this.dialog.open(AttachmentListDialogComponent, {
      data: { ownerType, ownerId },
    });
  }

  protected openNotes(): void {
    const { ownerType, ownerId } = this.data.event;

    if (ownerType === undefined || ownerId === undefined) {
      return;
    }

    void this.noteService.load();

    this.dialog.open(NoteDialogComponent, {
      data: { ownerType, ownerId },
    });
  }
}
