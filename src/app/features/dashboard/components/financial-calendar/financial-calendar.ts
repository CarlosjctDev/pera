import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { Dialog } from '@angular/cdk/dialog';

import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import { ToastrService } from '@app/core/components/toastr/toastr';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { I18nService } from '@app/core/i18n/i18n.service';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { I18nDate } from '@app/core/i18n/pipes/date.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { normalizeText } from '@app/core/utils/text.utils';
import { SELF_CONTACT_ID } from '@app/features/master-data/models/contact.model';
import { AttachmentListDialogComponent } from '@app/features/attachments/components/attachment-list-dialog/attachment-list-dialog';
import { AttachmentService } from '@app/features/attachments/services/attachment.service';
import { NoteDialogComponent } from '@app/features/notes/components/note-dialog/note-dialog';
import { NoteService } from '@app/features/notes/services/note.service';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { AccountService } from '@app/features/transactions/services/account.service';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';
import { SavingsDialogComponent } from '@app/features/transactions/components/savings-dialog/savings-dialog';
import { TRANSACTION_TYPE_COLORS } from '@app/features/transactions/models/transaction-type.model';
import { parseIsoDate } from '@app/features/transactions/utils/recurrence.utils';

import { DashboardPeriodService } from '../../services/dashboard-period.service';
import { EventDetailDialogComponent } from '../event-detail-dialog/event-detail-dialog';
import {
  buildMonthMatrix,
  groupEventsByDay,
  monthRange,
  toDayKey,
} from '../../utils/calendar.utils';

import type { EventDetailData } from '../event-detail-dialog/event-detail-dialog';
import type { CalendarEvent } from '../../models/calendar-event.model';
import type { SavingsDialogData } from '@app/features/transactions/components/savings-dialog/savings-dialog';
import type { SavingDraft } from '@app/features/transactions/models/saving-draft.model';
import type { Account } from '@app/features/transactions/models/account.model';
import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';

const MOVEMENT_MARKERS: Record<TransactionType, string> = {
  income: 'bg-emerald-500',
  expense: 'bg-red-500',
  saving: 'bg-amber-500',
};

@Component({
  selector: 'app-financial-calendar',
  imports: [Icon, T, I18nCurrency, I18nDate, TippyDirective],
  templateUrl: './financial-calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialCalendar implements OnInit {
  protected readonly period = inject(DashboardPeriodService);
  protected readonly profile = inject(ProfileService);

  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly contactService = inject(ContactService);
  private readonly attachmentService = inject(AttachmentService);
  private readonly noteService = inject(NoteService);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(Dialog);
  private readonly toastr = inject(ToastrService);

  protected readonly weekdays: readonly number[] = [0, 1, 2, 3, 4, 5, 6];
  protected readonly movementTypes: readonly TransactionType[] = ['income', 'expense', 'saving'];
  protected readonly selectedDay = signal<string | null>(null);

  private readonly categoryNames = computed(() => {
    const map = new Map<number, string>();

    for (const category of this.categoryService.categories()) {
      if (category.id !== undefined) {
        map.set(category.id, category.name);
      }
    }

    return map;
  });

  private readonly contactNames = computed(() => {
    const map = new Map<number, string>();

    for (const contact of this.contactService.contacts()) {
      if (contact.id !== undefined) {
        map.set(contact.id, contact.name);
      }
    }

    return map;
  });

  private readonly ownersWithAttachments = computed(() => {
    const keys = new Set<string>();

    for (const attachment of this.attachmentService.attachments()) {
      keys.add(`${attachment.ownerType}:${attachment.ownerId}`);
    }

    return keys;
  });

  private readonly ownersWithNotes = computed(() => {
    const keys = new Set<string>();

    for (const note of this.noteService.notes()) {
      keys.add(`${note.ownerType}:${note.ownerId}`);
    }

    return keys;
  });

  protected readonly monthLabel = computed<TranslationKey>(
    () => `dashboard.months.${this.period.selectedMonth() - 1}` as TranslationKey,
  );

  protected readonly weeks = computed<readonly (readonly Date[])[]>(() =>
    buildMonthMatrix(this.period.selectedYear(), this.period.selectedMonth()),
  );

  protected readonly events = computed<readonly CalendarEvent[]>(() => {
    const { start, end } = monthRange(this.period.selectedYear(), this.period.selectedMonth());
    const categories = this.categoryNames();
    const contacts = this.contactNames();
    const result: CalendarEvent[] = [];

    for (const transaction of this.transactionService.transactions()) {
      const day = toDayKey(transaction.date);

      if (day < start || day > end) {
        continue;
      }

      const category = categories.get(transaction.categoryId) ?? '';

      result.push({
        key: `movement-${transaction.id ?? `${day}-${transaction.concept}-${transaction.amount}`}`,
        kind: 'movement',
        day,
        label: transaction.concept || category || '—',
        sublabel: transaction.concept ? category || undefined : undefined,
        amount: transaction.amount,
        transactionType: transaction.type,
        ownerType: 'transaction',
        ownerId: transaction.id,
      });
    }

    for (const account of this.accountService.accounts()) {
      if (account.status !== 'pending' || account.dueDate === undefined) {
        continue;
      }

      if (account.dueDate < start || account.dueDate > end) {
        continue;
      }

      const contact = contacts.get(account.contactId) ?? '';

      result.push({
        key: `account-${account.id ?? `${account.dueDate}-${account.concept}`}`,
        kind: account.type === 'receivable' ? 'receivable' : 'payable',
        day: account.dueDate,
        label: account.concept || contact || '—',
        sublabel: account.concept ? contact || undefined : undefined,
        amount: account.amount,
        ownerType: 'account',
        ownerId: account.id,
      });
    }

    return result;
  });

  private readonly eventsByDay = computed(() => groupEventsByDay(this.events()));

  protected readonly selectedEvents = computed<readonly CalendarEvent[]>(() => {
    const day = this.selectedDay();

    return day === null ? [] : (this.eventsByDay().get(day) ?? []);
  });

  protected readonly selectedDate = computed<Date | null>(() => {
    const day = this.selectedDay();

    return day === null ? null : parseIsoDate(day);
  });

  constructor() {
    effect(() => {
      this.period.selectedYear();
      this.period.selectedMonth();
      this.selectedDay.set(null);
    });
  }

  ngOnInit(): void {
    void this.transactionService.load();
    void this.accountService.load();
    void this.categoryService.load();
    void this.contactService.load();
    void this.attachmentService.load();
    void this.noteService.load();
  }

  protected inMonth(date: Date): boolean {
    return this.period.isInSelectedMonth(date);
  }

  protected isToday(date: Date): boolean {
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  protected isSelected(date: Date): boolean {
    return this.inMonth(date) && this.selectedDay() === toDayKey(date);
  }

  protected eventsForDay(date: Date): readonly CalendarEvent[] {
    return this.eventsByDay().get(toDayKey(date)) ?? [];
  }

  protected dayClass(date: Date): string {
    const base = 'flex min-h-16 flex-col items-start rounded-lg p-1.5 text-left transition';

    if (!this.inMonth(date)) {
      return `${base} text-app-muted/40`;
    }

    if (this.isSelected(date)) {
      return `${base} cursor-pointer bg-app-primary/10 ring-1 ring-inset ring-app-primary/40`;
    }

    if (this.isToday(date)) {
      return `${base} cursor-pointer bg-app-secondary ring-1 ring-inset ring-app-primary/30`;
    }

    return `${base} cursor-pointer hover:bg-app-secondary/60`;
  }

  protected selectDay(date: Date): void {
    if (!this.inMonth(date)) {
      return;
    }

    const key = toDayKey(date);

    this.selectedDay.set(this.selectedDay() === key ? null : key);
  }

  protected goToday(): void {
    this.period.goToday();
  }

  protected hasAttachments(event: CalendarEvent): boolean {
    return (
      event.ownerType !== undefined &&
      event.ownerId !== undefined &&
      this.ownersWithAttachments().has(`${event.ownerType}:${event.ownerId}`)
    );
  }

  protected hasNotes(event: CalendarEvent): boolean {
    return (
      event.ownerType !== undefined &&
      event.ownerId !== undefined &&
      this.ownersWithNotes().has(`${event.ownerType}:${event.ownerId}`)
    );
  }

  protected openNotes(event: CalendarEvent): void {
    if (event.ownerType === undefined || event.ownerId === undefined) {
      return;
    }

    void this.noteService.load();

    this.dialog.open(NoteDialogComponent, {
      data: { ownerType: event.ownerType, ownerId: event.ownerId },
    });
  }

  protected viewAttachments(event: CalendarEvent): void {
    if (event.ownerType === undefined || event.ownerId === undefined) {
      return;
    }

    void this.attachmentService.load();

    this.dialog.open(AttachmentListDialogComponent, {
      data: { ownerType: event.ownerType, ownerId: event.ownerId },
    });
  }

  protected markPaid(event: CalendarEvent): void {
    if (event.ownerType !== 'account' || event.ownerId === undefined) {
      return;
    }

    const account = this.accountService.accounts().find((item) => item.id === event.ownerId);

    if (account === undefined || account.status === 'paid') {
      return;
    }

    void this.payAccount(account);
  }

  protected openEventDetail(event: CalendarEvent): void {
    if (event.ownerType === undefined || event.ownerId === undefined) {
      return;
    }

    if (event.ownerType === 'transaction') {
      const transaction = this.transactionService
        .transactions()
        .find((item) => item.id === event.ownerId);

      if (transaction === undefined) {
        return;
      }

      this.dialog.open(EventDetailDialogComponent, {
        data: {
          event,
          badgeKey: this.eventBadge(event),
          icon: this.eventIcon(event),
          amountClass: this.amountClass(event),
          dateLabelKey: 'movements.date',
          categoryName: this.categoryNames().get(transaction.categoryId),
          contactName:
            transaction.contactId === undefined
              ? undefined
              : this.contactNames().get(transaction.contactId),
          scheduled: transaction.scheduledId !== undefined,
          incomeId: transaction.type === 'income' ? transaction.id : undefined,
        } satisfies EventDetailData,
      });

      return;
    }

    const account = this.accountService.accounts().find((item) => item.id === event.ownerId);

    if (account === undefined) {
      return;
    }

    this.dialog.open(EventDetailDialogComponent, {
      data: {
        event,
        badgeKey: this.eventBadge(event),
        icon: this.eventIcon(event),
        amountClass: this.amountClass(event),
        dateLabelKey: 'accounts.dueDate',
        categoryName:
          account.categoryId === undefined
            ? undefined
            : this.categoryNames().get(account.categoryId),
        contactName: this.contactNames().get(account.contactId),
        statusKey: `accounts.status.${account.status}` as TranslationKey,
        scheduled: false,
      } satisfies EventDetailData,
    });
  }

  private async payAccount(account: Account): Promise<void> {
    try {
      await this.accountService.pay(account);
      this.toastr.success('toasts.paid');
    } catch {
      this.toastr.error('toasts.saveError');
    }
  }

  protected canAddSaving(event: CalendarEvent): boolean {
    return (
      event.kind === 'movement' &&
      event.transactionType === 'income' &&
      event.ownerId !== undefined
    );
  }

  protected addSavings(event: CalendarEvent): void {
    if (!this.canAddSaving(event) || event.ownerId === undefined) {
      return;
    }

    const transaction = this.transactionService
      .transactions()
      .find((item) => item.id === event.ownerId);

    if (transaction === undefined || transaction.id === undefined) {
      return;
    }

    const saved = this.transactionService.savedAmountForIncome(transaction.id);
    const max = Math.max(0, Math.round((transaction.amount - saved) * 100) / 100);

    const dialogRef = this.dialog.open<readonly SavingDraft[] | undefined>(
      SavingsDialogComponent,
      { data: { max } satisfies SavingsDialogData },
    );

    dialogRef.closed.subscribe(async (drafts) => {
      if (drafts === undefined || drafts.length === 0 || transaction.id === undefined) {
        return;
      }

      try {
        for (const draft of drafts) {
          await this.transactionService.add({
            type: 'saving',
            categoryId: draft.categoryId as number,
            contactId: SELF_CONTACT_ID,
            date: transaction.date,
            concept: normalizeText(draft.concept),
            amount: Math.round((draft.amount as number) * 100) / 100,
            incomeId: transaction.id,
          });
        }

        this.toastr.success('toasts.saved');
      } catch {
        this.toastr.error('toasts.saveError');
      }
    });
  }

  protected markerClass(event: CalendarEvent): string {
    switch (event.kind) {
      case 'receivable':
        return 'bg-teal-500';
      case 'payable':
        return 'bg-rose-500';
      default:
        return MOVEMENT_MARKERS[event.transactionType ?? 'income'];
    }
  }

  protected movementMarker(type: TransactionType): string {
    return MOVEMENT_MARKERS[type];
  }

  protected movementLabel(type: TransactionType): TranslationKey {
    return `movements.type.${type}` as TranslationKey;
  }

  protected markerTooltip(event: CalendarEvent): string {
    const badge = this.i18n.t(this.eventBadge(event));
    const label = event.label;

    return label === '' || label === '—' || label === badge ? badge : `${badge} · ${label}`;
  }

  protected eventIcon(event: CalendarEvent): IconName {
    if (event.kind === 'receivable') {
      return 'income';
    }

    if (event.kind === 'payable') {
      return 'expense';
    }

    return event.transactionType ?? 'income';
  }

  protected eventBadge(event: CalendarEvent): TranslationKey {
    if (event.kind === 'movement') {
      return `movements.type.${event.transactionType ?? 'income'}` as TranslationKey;
    }

    return event.kind === 'receivable'
      ? 'dashboard.calendar.legend.receivable'
      : 'dashboard.calendar.legend.payable';
  }

  protected amountClass(event: CalendarEvent): string {
    if (event.kind === 'receivable') {
      return 'text-teal-600 dark:text-teal-400';
    }

    if (event.kind === 'payable') {
      return 'text-rose-600 dark:text-rose-400';
    }

    return TRANSACTION_TYPE_COLORS[event.transactionType ?? 'income'];
  }

  protected weekdayLabel(index: number): TranslationKey {
    return `dashboard.calendar.weekdays.${index}` as TranslationKey;
  }
}
