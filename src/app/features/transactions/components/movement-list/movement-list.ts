import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import type { TemplateRef } from '@angular/core';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { Icon } from '@app/core/components/icons/icon.component';
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
import { ContactService } from '@app/features/master-data/services/contact.service';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';
import { AttachmentListDialogComponent } from '@app/features/attachments/components/attachment-list-dialog/attachment-list-dialog';
import { AttachmentService } from '@app/features/attachments/services/attachment.service';
import { NoteDialogComponent } from '@app/features/notes/components/note-dialog/note-dialog';
import { NoteService } from '@app/features/notes/services/note.service';

import type { Contact } from '@app/features/master-data/models/contact.model';
import type { Category } from '@app/features/transactions/models/category.model';
import type { Transaction } from '@app/features/transactions/models/transaction.model';
import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';
import { TRANSACTION_TYPE_COLORS } from '@app/features/transactions/models/transaction-type.model';

const DEFAULT_QUERY: DataTableQuery = {
  page: 0,
  pageSize: 5,
  sort: null,
  searchTerms: {},
};

@Component({
  selector: 'app-movement-list',
  imports: [Icon, T, I18nDate, I18nCurrency, TippyDirective, DataTable],
  templateUrl: './movement-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementList {
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly profile = inject(ProfileService);
  private readonly contactService = inject(ContactService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly attachmentService = inject(AttachmentService);
  private readonly noteService = inject(NoteService);
  private readonly dataChanges = inject(DataChangesService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currency = this.profile.currency;
  protected readonly tableRows = signal<readonly Transaction[]>([]);
  protected readonly tableTotal = signal(0);
  protected readonly tableLoading = signal(true);

  private activeQuery: DataTableQuery = DEFAULT_QUERY;

  private readonly dateCell = viewChild<TemplateRef<unknown>>('dateCell');
  private readonly detailCell = viewChild<TemplateRef<unknown>>('detailCell');
  private readonly amountCell = viewChild<TemplateRef<unknown>>('amountCell');
  private readonly actionsCell = viewChild<TemplateRef<unknown>>('actionsCell');

  protected readonly categoryById = computed(() => {
    const map = new Map<number, Category>();
    for (const category of this.categoryService.categories()) {
      if (category.id !== undefined) {
        map.set(category.id, category);
      }
    }
    return map;
  });

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

  protected readonly columns = computed<readonly DataColumn<Transaction>[]>(() => {
    const dateCell = this.dateCell();
    const detailCell = this.detailCell();
    const amountCell = this.amountCell();
    const actionsCell = this.actionsCell();

    if (
      dateCell === undefined ||
      detailCell === undefined ||
      amountCell === undefined ||
      actionsCell === undefined
    ) {
      return [];
    }

    return [
      { key: 'date', labelKey: 'movements.date', sortable: true, cellTemplate: dateCell },
      {
        key: 'detail',
        labelKey: 'movements.detail',
        searchable: true,
        cellTemplate: detailCell,
      },
      {
        key: 'contact',
        labelKey: 'movements.contact',
        searchable: true,
        render: (transaction) => this.contactName(transaction) ?? '',
      },
      {
        key: 'amount',
        labelKey: 'movements.amount',
        sortable: true,
        align: 'right',
        cellTemplate: amountCell,
      },
      {
        key: 'actions',
        labelKey: 'common.actions',
        align: 'right',
        widthClass: 'w-24',
        cellTemplate: actionsCell,
      },
    ];
  });

  ngOnInit(): void {
    void this.fetch();
    void this.attachmentService.load();
    void this.noteService.load();

    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.fetch());
  }

  protected onTableQuery(query: DataTableQuery): void {
    this.activeQuery = query;
    void this.fetch();
  }

  protected async fetch(): Promise<void> {
    const query = this.activeQuery;

    this.tableLoading.set(true);

    try {
      const result = await this.transactionService.queryPage({
        offset: this.pageOffset(query),
        limit: query.pageSize,
        sort: this.isAllowedSort(query.sort),
        search: {
          detail: query.searchTerms['detail'] ?? '',
          contact: query.searchTerms['contact'] ?? '',
        },
      });

      this.tableRows.set(result.rows);
      this.tableTotal.set(result.total);
    } finally {
      this.tableLoading.set(false);
    }
  }

  protected amountClass(type: TransactionType): string {
    return TRANSACTION_TYPE_COLORS[type];
  }

  protected typeColor(type: TransactionType): string {
    return TRANSACTION_TYPE_COLORS[type];
  }

  protected contactName(transaction: Transaction): string | undefined {
    if (transaction.contactId === undefined) {
      return undefined;
    }

    return this.contactById().get(transaction.contactId)?.name;
  }

  protected confirmDelete(transaction: Transaction): void {
    if (transaction.id === undefined) {
      return;
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('movements.deleteConfirmTitle'),
        message: this.i18n.t('movements.deleteConfirmMessage'),
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
        await this.transactionService.remove(transaction.id as number);
        await this.fetch();
        this.toastr.success('toasts.deleted');
      } catch {
        this.toastr.error('toasts.deleteError');
      }
    });
  }

  protected detailText(transaction: Transaction): string {
    const category = this.categoryById().get(transaction.categoryId)?.name ?? '';

    if (transaction.concept === '') {
      return category;
    }

    return category === '' ? transaction.concept : `${category} · ${transaction.concept}`;
  }

  protected viewAttachments(transaction: Transaction): void {
    if (transaction.id === undefined) {
      return;
    }

    void this.attachmentService.load();

    this.dialog.open(AttachmentListDialogComponent, {
      data: { ownerType: 'transaction', ownerId: transaction.id },
    });
  }

  protected hasNotes(transaction: Transaction): boolean {
    return (
      transaction.id !== undefined &&
      this.ownersWithNotes().has(`transaction:${transaction.id}`)
    );
  }

  protected openNotes(transaction: Transaction): void {
    if (transaction.id === undefined) {
      return;
    }

    void this.noteService.load();

    this.dialog.open(NoteDialogComponent, {
      data: { ownerType: 'transaction', ownerId: transaction.id },
    });
  }

  protected hasAttachments(transaction: Transaction): boolean {
    return (
      transaction.id !== undefined &&
      this.ownersWithAttachments().has(`transaction:${transaction.id}`)
    );
  }

  private isAllowedSort(
    sort: DataTableQuery['sort'],
  ): { key: 'date' | 'amount'; dir: 'asc' | 'desc' } | null {
    if (sort === null || (sort.key !== 'date' && sort.key !== 'amount')) {
      return null;
    }

    return { key: sort.key, dir: sort.dir };
  }

  private pageOffset(query: DataTableQuery): number {
    return query.pageSize === -1 ? 0 : query.page * query.pageSize;
  }
}
