import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DIALOG_DATA, Dialog } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { I18nDate } from '@app/core/i18n/pipes/date.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { normalizeText } from '@app/core/utils/text.utils';
import { AttachmentListDialogComponent } from '@app/features/attachments/components/attachment-list-dialog/attachment-list-dialog';
import { SELF_CONTACT_ID } from '@app/features/master-data/models/contact.model';
import { NoteDialogComponent } from '@app/features/notes/components/note-dialog/note-dialog';
import { NoteService } from '@app/features/notes/services/note.service';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { SavingsDialogComponent } from '@app/features/transactions/components/savings-dialog/savings-dialog';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';
import { parseIsoDate } from '@app/features/transactions/utils/recurrence.utils';

import type { SavingsDialogData } from '@app/features/transactions/components/savings-dialog/savings-dialog';
import type { SavingDraft } from '@app/features/transactions/models/saving-draft.model';
import type { Transaction } from '@app/features/transactions/models/transaction.model';
import type { CalendarEvent } from '../../models/calendar-event.model';

export interface EventDetailSaving {
  readonly id?: number;
  readonly label: string;
  readonly amount: number;
}

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
  readonly incomeId?: number;
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
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly toastr = inject(ToastrService);
  protected readonly data = inject<EventDetailData>(DIALOG_DATA);
  protected readonly profile = inject(ProfileService);

  protected readonly date = parseIsoDate(this.data.event.day);

  private readonly categoryNames = computed(() => {
    const map = new Map<number, string>();

    for (const category of this.categoryService.categories()) {
      if (category.id !== undefined) {
        map.set(category.id, category.name);
      }
    }

    return map;
  });

  protected readonly notes = computed(() => {
    const { ownerType, ownerId } = this.data.event;

    if (ownerType === undefined || ownerId === undefined) {
      return [];
    }

    return this.noteService.byOwner(ownerType, ownerId);
  });

  protected readonly savings = computed<readonly EventDetailSaving[]>(() => {
    const incomeId = this.data.incomeId;

    if (incomeId === undefined) {
      return [];
    }

    return this.transactionService.savingsForIncome(incomeId).map((saving) => ({
      id: saving.id,
      label: this.detailText(saving),
      amount: saving.amount,
    }));
  });

  constructor() {
    void this.noteService.load();
    void this.transactionService.load();
    void this.categoryService.load();
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

  protected addSavings(): void {
    const incomeId = this.data.incomeId;

    if (incomeId === undefined) {
      return;
    }

    const income = this.transactionService.transactions().find((item) => item.id === incomeId);

    if (income === undefined) {
      return;
    }

    const saved = this.transactionService.savedAmountForIncome(incomeId);
    const max = Math.max(0, Math.round((income.amount - saved) * 100) / 100);

    const dialogRef = this.dialog.open<readonly SavingDraft[] | undefined>(
      SavingsDialogComponent,
      { data: { max } satisfies SavingsDialogData },
    );

    dialogRef.closed.subscribe(async (drafts) => {
      if (drafts === undefined || drafts.length === 0 || incomeId === undefined) {
        return;
      }

      try {
        for (const draft of drafts) {
          await this.transactionService.add({
            type: 'saving',
            categoryId: draft.categoryId as number,
            contactId: SELF_CONTACT_ID,
            date: income.date,
            concept: normalizeText(draft.concept),
            amount: Math.round((draft.amount as number) * 100) / 100,
            incomeId,
          });
        }

        this.toastr.success('toasts.saved');
      } catch {
        this.toastr.error('toasts.saveError');
      }
    });
  }

  private detailText(transaction: Transaction): string {
    const category = this.categoryNames().get(transaction.categoryId) ?? '';

    if (transaction.concept === '') {
      return category || '—';
    }

    return category === '' ? transaction.concept : `${category} · ${transaction.concept}`;
  }
}
