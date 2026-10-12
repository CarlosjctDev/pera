import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import type { TemplateRef } from '@angular/core';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { SelectComponent } from '@app/core/components/select/select.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { DataTable } from '@app/core/components/table/data-table';
import type { DataColumn, DataTableQuery } from '@app/core/components/table/data-table.model';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { I18nService } from '@app/core/i18n/i18n.service';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { I18nDate } from '@app/core/i18n/pipes/date.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { normalizeText } from '@app/core/utils/text.utils';
import { NoteDialogComponent } from '@app/features/notes/components/note-dialog/note-dialog';
import { NoteService } from '@app/features/notes/services/note.service';
import { currencySymbol } from '@app/features/profile/models/currency.model';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { MasterDataDialogsService } from '@app/features/master-data/services/master-data-dialogs.service';
import { ScheduleFields } from '@app/features/transactions/components/schedule-fields/schedule-fields';
import { AccountService } from '@app/features/transactions/services/account.service';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { ScheduledMovementService } from '@app/features/transactions/services/scheduled-movement.service';
import { nextDueIso, parseIsoDate } from '@app/features/transactions/utils/recurrence.utils';
import { AttachmentListDialogComponent } from '@app/features/attachments/components/attachment-list-dialog/attachment-list-dialog';
import { AttachmentPicker } from '@app/features/attachments/components/attachment-picker/attachment-picker';
import { AttachmentService } from '@app/features/attachments/services/attachment.service';

import type { Account, AccountType } from '@app/features/transactions/models/account.model';
import type { Contact } from '@app/features/master-data/models/contact.model';
import type { ContactKind } from '@app/features/master-data/models/contact-kind.model';

const DEFAULT_QUERY: DataTableQuery = {
  page: 0,
  pageSize: 5,
  sort: null,
  searchTerms: {},
};

@Component({
  selector: 'app-accounts',
  imports: [
    FormsModule,
    Icon,
    SelectComponent,
    T,
    I18nDate,
    I18nCurrency,
    TippyDirective,
    DataTable,
    ScheduleFields,
    AttachmentPicker,
  ],
  templateUrl: './accounts.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Accounts {
  readonly accountType = input<AccountType>('receivable');

  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly profile = inject(ProfileService);
  private readonly accountService = inject(AccountService);
  private readonly scheduledMovementService = inject(ScheduledMovementService);
  private readonly contactService = inject(ContactService);
  private readonly masterDialogs = inject(MasterDataDialogsService);
  private readonly categoryService = inject(CategoryService);
  private readonly attachmentService = inject(AttachmentService);
  private readonly noteService = inject(NoteService);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);

  protected readonly currency = this.profile.currency;
  protected readonly symbol = computed(() => currencySymbol(this.currency()));
  protected readonly contacts = this.contactService.contacts;
  protected readonly categories = this.categoryService.categories;

  protected readonly contactOptions = computed(() => {
    const kind = this.contactKind();

    if (kind === null) {
      return [];
    }

    return this.contacts()
      .filter((contact) => contact.kind === kind)
      .map((contact) => ({ value: contact.id ?? null, label: contact.name }));
  });

  protected readonly categoryOptions = computed(() =>
    this.categories().map((category) => ({ value: category.id ?? null, label: category.name })),
  );

  protected readonly tableRows = signal<readonly Account[]>([]);
  protected readonly tableTotal = signal(0);
  protected readonly tableLoading = signal(true);
  protected readonly pendingTotal = signal(0);

  private activeQuery: DataTableQuery = DEFAULT_QUERY;

  private readonly amountCell = viewChild<TemplateRef<unknown>>('amountCell');
  private readonly dueDateCell = viewChild<TemplateRef<unknown>>('dueDateCell');
  private readonly statusCell = viewChild<TemplateRef<unknown>>('statusCell');
  private readonly actionsCell = viewChild<TemplateRef<unknown>>('actionsCell');
  private readonly scheduleFields = viewChild.required(ScheduleFields);
  private readonly attachments = viewChild.required(AttachmentPicker);

  protected readonly contactById = computed(() => {
    const map = new Map<number, Contact>();
    for (const contact of this.contactService.contacts()) {
      if (contact.id !== undefined) {
        map.set(contact.id, contact);
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

  protected readonly columns = computed<readonly DataColumn<Account>[]>(() => {
    const amountCell = this.amountCell();
    const dueDateCell = this.dueDateCell();
    const statusCell = this.statusCell();
    const actionsCell = this.actionsCell();

    if (
      amountCell === undefined ||
      dueDateCell === undefined ||
      statusCell === undefined ||
      actionsCell === undefined
    ) {
      return [];
    }

    return [
      {
        key: 'contact',
        labelKey: 'accounts.contact',
        searchable: true,
        render: (account) => this.contactById().get(account.contactId)?.name ?? '',
      },
      {
        key: 'concept',
        labelKey: 'accounts.concept',
        searchable: true,
        render: (account) => account.concept,
      },
      { key: 'dueDate', labelKey: 'accounts.dueDate', sortable: true, cellTemplate: dueDateCell },
      {
        key: 'amount',
        labelKey: 'accounts.amount',
        sortable: true,
        align: 'right',
        cellTemplate: amountCell,
      },
      { key: 'status', labelKey: 'accounts.statusLabel', cellTemplate: statusCell },
      {
        key: 'actions',
        labelKey: 'common.actions',
        align: 'right',
        widthClass: 'w-36',
        cellTemplate: actionsCell,
      },
    ];
  });

  protected readonly contactId = signal<number | null>(null);
  protected readonly contactKind = signal<ContactKind | null>(null);
  protected readonly categoryId = signal<number | null>(null);
  protected readonly amount = signal<number | null>(null);
  protected readonly concept = signal('');
  protected readonly dueDate = signal('');
  protected readonly contactError = signal(false);
  protected readonly categoryError = signal(false);
  protected readonly amountError = signal(false);
  protected readonly saving = signal(false);

  ngOnInit(): void {
    void this.contactService.load();
    void this.categoryService.load();
    void this.attachmentService.load();
    void this.noteService.load();
    void this.fetch();

    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.fetch());
  }

  protected titleKey(): TranslationKey {
    return this.accountType() === 'receivable'
      ? 'accounts.receivableTitle'
      : 'accounts.payableTitle';
  }

  protected submitKey(): TranslationKey {
    return this.accountType() === 'receivable'
      ? 'accounts.submit.receivable'
      : 'accounts.submit.payable';
  }

  protected onTableQuery(query: DataTableQuery): void {
    this.activeQuery = query;
    void this.fetch();
  }

  protected async fetch(): Promise<void> {
    const query = this.activeQuery;

    this.tableLoading.set(true);

    try {
      const sort = this.isAllowedSort(query.sort);

      const result = await this.accountService.queryPage({
        type: this.accountType(),
        offset: this.pageOffset(query),
        limit: query.pageSize,
        sort,
        search: {
          contact: query.searchTerms['contact'] ?? '',
          concept: query.searchTerms['concept'] ?? '',
        },
      });

      this.tableRows.set(result.rows);
      this.tableTotal.set(result.total);
      this.pendingTotal.set(result.pendingTotal);
    } finally {
      this.tableLoading.set(false);
    }
  }

  protected onContactChange(value: number | null): void {
    this.contactId.set(typeof value === 'number' ? value : null);
    this.contactError.set(false);
  }

  protected setContactKind(kind: ContactKind): void {
    if (this.contactKind() === kind) {
      return;
    }

    this.contactKind.set(kind);
    this.contactId.set(null);
    this.contactError.set(false);
  }

  protected contactKindClass(kind: ContactKind): string {
    return this.contactKind() === kind
      ? 'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-app-primary px-3 py-2 text-sm font-semibold text-app-primary-fg transition'
      : 'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-app-secondary px-3 py-2 text-sm font-semibold text-app-secondary-fg transition hover:bg-app-secondary-hover';
  }

  protected onCategoryChange(value: number | null): void {
    this.categoryId.set(typeof value === 'number' ? value : null);
    this.categoryError.set(false);
  }

  protected onAmountChange(value: number | null): void {
    this.amount.set(typeof value === 'number' && !Number.isNaN(value) ? value : null);
    this.amountError.set(false);
  }

  protected contactSubmitLabel(): TranslationKey {
    const kind = this.contactKind();

    return kind === null ? ('' as TranslationKey) : (`contacts.submit.${kind}` as TranslationKey);
  }

  protected async addCategory(): Promise<void> {
    const category = await this.masterDialogs.addCategory();

    if (category?.id !== undefined) {
      this.categoryId.set(category.id);
      this.categoryError.set(false);
    }
  }

  protected async addContact(): Promise<void> {
    const kind = this.contactKind();

    if (kind === null) {
      return;
    }

    const contact = await this.masterDialogs.addContact(kind);

    if (contact?.id !== undefined) {
      this.contactId.set(contact.id);
      this.contactError.set(false);
    }
  }

  protected async add(): Promise<void> {
    const amount = this.amount();

    this.contactError.set(this.contactId() === null);
    this.categoryError.set(this.categoryId() === null);
    this.amountError.set(amount === null || amount <= 0);

    if (this.contactError() || this.categoryError() || this.amountError()) {
      return;
    }

    this.saving.set(true);

    const categoryId = this.categoryId() as number;
    const contactId = this.contactId() as number;
    const rounded = Math.round((amount as number) * 100) / 100;
    const concept = normalizeText(this.concept());
    const dueDate = this.dueDate() || undefined;
    const schedule = this.scheduleFields();
    const recurrence = schedule.recurrence();

    try {
      const account = await this.accountService.create({
        type: this.accountType(),
        categoryId,
        contactId,
        amount: rounded,
        concept,
        dueDate,
        status: 'pending',
      });

      if (recurrence === undefined) {
        await this.saveAttachments(account.id as number);
      }

      if (recurrence !== undefined) {
        const anchorDate = dueDate !== undefined ? parseIsoDate(dueDate) : new Date();
        const startDate = nextDueIso(recurrence, dueDate, anchorDate) ?? this.todayString();

        await this.scheduledMovementService.schedule({
          type: this.accountType() === 'receivable' ? 'income' : 'expense',
          accountType: this.accountType(),
          categoryId,
          contactId,
          concept,
          amount: rounded,
          startDate,
          recurrence,
          nextDate: startDate,
          active: true,
        });
      }

      this.attachments().clear();
      this.contactId.set(null);
      this.contactKind.set(null);
      this.categoryId.set(null);
      this.amount.set(null);
      this.concept.set('');
      this.dueDate.set('');
      schedule.reset();
      this.activeQuery = { ...this.activeQuery, page: 0 };
      await this.fetch();
      this.toastr.success(recurrence !== undefined ? 'toasts.scheduledSaved' : 'toasts.saved');
    } catch {
      this.toastr.error('toasts.saveError');
    } finally {
      this.saving.set(false);
    }
  }

  protected async markPaid(account: Account): Promise<void> {
    if (account.id === undefined || account.status === 'paid') {
      return;
    }

    try {
      await this.accountService.pay(account);
      this.toastr.success('toasts.paid');
      await this.fetch();
    } catch {
      this.toastr.error('toasts.saveError');
    }
  }

  protected confirmDelete(account: Account): void {
    if (account.id === undefined) {
      return;
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('accounts.deleteConfirmTitle'),
        message: this.i18n.t('accounts.deleteConfirmMessage'),
        confirmLabel: this.i18n.t('common.confirm'),
        cancelLabel: this.i18n.t('common.cancel'),
        variant: 'danger',
      },
    });

    dialogRef.closed.subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      try {
        await this.accountService.remove(account.id as number);
        await this.fetch();
        this.toastr.success('toasts.deleted');
      } catch {
        this.toastr.error('toasts.deleteError');
      }
    });
  }

  protected contactName(account: Account): string | undefined {
    return this.contactById().get(account.contactId)?.name;
  }

  protected amountClass(account: Account): string {
    if (account.status === 'paid') {
      return 'text-app-muted line-through';
    }

    return this.accountType() === 'receivable'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400';
  }

  protected statusLabel(account: Account): TranslationKey {
    return account.status === 'pending' ? 'accounts.status.pending' : 'accounts.status.paid';
  }

  private isAllowedSort(
    sort: DataTableQuery['sort'],
  ): { key: 'amount' | 'dueDate'; dir: 'asc' | 'desc' } | null {
    if (sort === null || (sort.key !== 'amount' && sort.key !== 'dueDate')) {
      return null;
    }

    return { key: sort.key, dir: sort.dir };
  }

  private pageOffset(query: DataTableQuery): number {
    return query.pageSize === -1 ? 0 : query.page * query.pageSize;
  }

  private todayString(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 10);
  }

  private async saveAttachments(ownerId: number): Promise<void> {
    const pending = this.attachments().pending();

    if (pending.length === 0) {
      return;
    }

    await this.attachmentService.addMany(
      pending.map((file) => ({ ...file, ownerType: 'account', ownerId })),
    );
  }

  protected viewAttachments(account: Account): void {
    if (account.id === undefined) {
      return;
    }

    this.dialog.open(AttachmentListDialogComponent, {
      data: { ownerType: 'account', ownerId: account.id },
    });
  }

  protected hasAttachments(account: Account): boolean {
    return account.id !== undefined && this.ownersWithAttachments().has(`account:${account.id}`);
  }

  protected hasNotes(account: Account): boolean {
    return account.id !== undefined && this.ownersWithNotes().has(`account:${account.id}`);
  }

  protected openNotes(account: Account): void {
    if (account.id === undefined) {
      return;
    }

    void this.noteService.load();

    this.dialog.open(NoteDialogComponent, {
      data: { ownerType: 'account', ownerId: account.id },
    });
  }
}
