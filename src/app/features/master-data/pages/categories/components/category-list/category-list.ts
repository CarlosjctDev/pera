import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import type { TemplateRef } from '@angular/core';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { DataTable } from '@app/core/components/table/data-table';
import type { DataColumn } from '@app/core/components/table/data-table.model';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { I18nService } from '@app/core/i18n/i18n.service';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';

import type { Category } from '@app/features/transactions/models/category.model';

@Component({
  selector: 'app-category-list',
  imports: [FormsModule, Icon, T, TippyDirective, DataTable],
  templateUrl: './category-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryList {
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = this.categoryService.loading;

  protected readonly categories = computed(() => this.categoryService.categories());

  protected readonly categoriesInUse = computed(
    () =>
      new Set(this.transactionService.transactions().map((transaction) => transaction.categoryId)),
  );

  private readonly nameCell = viewChild<TemplateRef<unknown>>('nameCell');
  private readonly actionsCell = viewChild<TemplateRef<unknown>>('actionsCell');
  protected readonly editRow = viewChild<TemplateRef<unknown>>('editCell');

  protected readonly columns = computed<readonly DataColumn<Category>[]>(() => {
    const nameCell = this.nameCell();
    const actionsCell = this.actionsCell();

    if (nameCell === undefined || actionsCell === undefined) {
      return [];
    }

    return [
      {
        key: 'name',
        labelKey: 'categories.name',
        searchable: true,
        sortable: true,
        cellTemplate: nameCell,
      },
      {
        key: 'actions',
        labelKey: 'common.actions',
        align: 'right',
        widthClass: 'w-20',
        cellTemplate: actionsCell,
      },
    ];
  });

  protected readonly editingId = signal<number | null>(null);
  protected readonly editCategoryName = signal('');
  protected readonly editCategoryDuplicate = signal(false);

  protected startEdit(category: Category): void {
    if (category.id === undefined) {
      return;
    }

    this.editingId.set(category.id);
    this.editCategoryName.set(category.name);
    this.editCategoryDuplicate.set(false);
  }

  protected async saveEdit(category: Category): Promise<void> {
    const name = normalizeText(this.editCategoryName());

    if (!name) {
      this.cancelEdit();
      return;
    }

    if (this.categoryNameExists(name, category.id)) {
      this.editCategoryDuplicate.set(true);
      return;
    }

    if (category.id === undefined) {
      this.cancelEdit();
      return;
    }

    await this.categoryService.update({ id: category.id, name });
    this.cancelEdit();
    this.toastr.success('toasts.updated');
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editCategoryName.set('');
    this.editCategoryDuplicate.set(false);
  }

  protected readonly isEditing = (category: Category): boolean =>
    category.id !== undefined && this.editingId() === category.id;

  protected confirmDelete(category: Category): void {
    if (category.id === undefined || this.isInUse(category.id)) {
      return;
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('categories.deleteConfirmTitle'),
        message: this.i18n.t('categories.deleteConfirmMessage'),
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
        await this.categoryService.remove(category.id as number);
        await this.transactionService.load();
        this.toastr.success('toasts.deleted');
      } catch {
        this.toastr.error('toasts.deleteError');
      }
    });
  }

  protected isInUse(id: number | undefined): boolean {
    return id === undefined ? false : this.categoriesInUse().has(id);
  }

  private categoryNameExists(name: string, excludeId?: number): boolean {
    const normalized = name.toLowerCase();

    return this.categoryService
      .categories()
      .some(
        (category) =>
          category.id !== excludeId && category.name.trim().toLowerCase() === normalized,
      );
  }
}
