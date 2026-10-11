import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { DataTable } from '@app/core/components/table/data-table';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { I18nService } from '@app/core/i18n/i18n.service';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { I18nDate } from '@app/core/i18n/pipes/date.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { ScheduledMovementService } from '@app/features/transactions/services/scheduled-movement.service';
import { recurrenceLabel } from '@app/features/transactions/utils/recurrence.utils';

import type { DataColumn } from '@app/core/components/table/data-table.model';
import type { AccountType } from '@app/features/transactions/models/account.model';
import type { Category } from '@app/features/transactions/models/category.model';
import type { ScheduledMovement } from '@app/features/transactions/models/scheduled-movement.model';
import { TRANSACTION_TYPE_COLORS } from '@app/features/transactions/models/transaction-type.model';
import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';

export interface ScheduledListData {
  readonly type?: TransactionType | null;
  readonly accountType?: AccountType | null;
}

@Component({
  selector: 'app-scheduled-list-dialog',
  imports: [DialogShellComponent, DataTable, Icon, T, TippyDirective, I18nCurrency, I18nDate],
  templateUrl: './scheduled-list-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledListDialogComponent implements OnInit {
  private readonly dialogRef = inject(DialogRef<boolean>);
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly toastr = inject(ToastrService);
  private readonly profile = inject(ProfileService);
  private readonly categoryService = inject(CategoryService);
  private readonly scheduledService = inject(ScheduledMovementService);

  private readonly data = inject<ScheduledListData>(DIALOG_DATA, { optional: true });

  protected readonly currency = this.profile.currency;
  protected readonly loading = signal(true);
  protected readonly rows = computed(() => {
    const accountType = this.data?.accountType ?? null;
    const type = this.data?.type ?? null;
    const items = this.scheduledService.scheduled();

    if (accountType !== null) {
      return items.filter((item) => item.accountType === accountType);
    }

    if (type !== null) {
      return items.filter((item) => item.accountType === undefined && item.type === type);
    }

    return items.filter((item) => item.accountType === undefined);
  });

  private readonly dateCell = viewChild<TemplateRef<unknown>>('dateCell');
  private readonly typeCell = viewChild<TemplateRef<unknown>>('typeCell');
  private readonly amountCell = viewChild<TemplateRef<unknown>>('amountCell');
  private readonly recurrenceCell = viewChild<TemplateRef<unknown>>('recurrenceCell');
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

  protected readonly columns = computed<readonly DataColumn<ScheduledMovement>[]>(() => [
    {
      key: 'nextDate',
      labelKey: 'scheduled.next',
      sortable: true,
      cellTemplate: this.dateCell() ?? undefined,
    },
    {
      key: 'type',
      labelKey: 'scheduled.type',
      cellTemplate: this.typeCell() ?? undefined,
    },
    {
      key: 'concept',
      labelKey: 'movements.detail',
      searchable: true,
      render: (item) => this.detailText(item),
    },
    {
      key: 'amount',
      labelKey: 'movements.amount',
      sortable: true,
      align: 'right',
      cellTemplate: this.amountCell() ?? undefined,
    },
    {
      key: 'recurrence',
      labelKey: 'scheduled.recurrence',
      cellTemplate: this.recurrenceCell() ?? undefined,
    },
    {
      key: 'actions',
      labelKey: 'common.actions',
      align: 'right',
      widthClass: 'w-40',
      cellTemplate: this.actionsCell() ?? undefined,
    },
  ]);

  ngOnInit(): void {
    void this.scheduledService
      .load()
      .catch(() => this.toastr.error('toasts.deleteError'))
      .finally(() => this.loading.set(false));
  }

  protected recurrenceFor(item: ScheduledMovement) {
    return recurrenceLabel(item.recurrence);
  }

  protected detailText(item: ScheduledMovement): string {
    const category = this.categoryById().get(item.categoryId)?.name ?? '';

    if (item.concept === '') {
      return category;
    }

    return category === '' ? item.concept : `${category} · ${item.concept}`;
  }

  protected typeLabel(type: TransactionType): TranslationKey {
    return `movements.type.${type}` as TranslationKey;
  }

  protected typeColor(type: TransactionType): string {
    return TRANSACTION_TYPE_COLORS[type];
  }

  protected async onToggle(item: ScheduledMovement): Promise<void> {
    if (item.id === undefined) {
      return;
    }

    try {
      await this.scheduledService.toggle(item.id);
      this.toastr.success(item.active ? 'toasts.scheduledPaused' : 'toasts.scheduledResumed');
    } catch {
      this.toastr.error('toasts.saveError');
    }
  }

  protected onConfirmDelete(item: ScheduledMovement): void {
    if (item.id === undefined) {
      return;
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('scheduled.deleteConfirmTitle'),
        message: this.i18n.t('scheduled.deleteConfirmMessage'),
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
        await this.scheduledService.remove(item.id as number);
        this.toastr.success('toasts.scheduledDeleted');
      } catch {
        this.toastr.error('toasts.deleteError');
      }
    });
  }

  protected close(): void {
    this.dialogRef.close(false);
  }
}
