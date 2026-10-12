import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Dialog } from '@angular/cdk/dialog';

import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { ExpenseForm } from '@app/features/transactions/components/expense-form/expense-form';
import { IncomeForm } from '@app/features/transactions/components/income-form/income-form';
import { MovementList } from '@app/features/transactions/components/movement-list/movement-list';
import { MovementTypes } from '@app/features/transactions/components/movement-types/movement-types';
import { SavingForm } from '@app/features/transactions/components/saving-form/saving-form';
import { ScheduledListDialogComponent } from '@app/features/transactions/components/scheduled-list-dialog/scheduled-list-dialog';
import { Accounts } from '@app/features/transactions/pages/accounts/accounts';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';

import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';

type Section = 'movements' | 'receivable' | 'payable';

const SECTION_ICONS: Record<Section, IconName> = {
  movements: 'transactions',
  receivable: 'wallet',
  payable: 'expense',
};

@Component({
  selector: 'app-transactions',
  imports: [
    Icon,
    T,
    TippyDirective,
    MovementTypes,
    IncomeForm,
    ExpenseForm,
    SavingForm,
    MovementList,
    Accounts,
  ],
  templateUrl: './transactions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Transactions {
  private readonly dialog = inject(Dialog);
  private readonly contactService = inject(ContactService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);

  protected readonly sections: readonly Section[] = ['movements', 'receivable', 'payable'];
  protected readonly section = signal<Section>('movements');

  protected readonly type = signal<TransactionType | null>(null);

  ngOnInit(): void {
    void this.contactService.load();
    void this.categoryService.load();
    void this.transactionService.load();
  }

  protected selectSection(section: Section): void {
    this.section.set(section);
  }

  protected openScheduled(): void {
    const section = this.section();

    if (section === 'receivable' || section === 'payable') {
      this.dialog.open(ScheduledListDialogComponent, {
        data: { accountType: section },
      });
      return;
    }

    this.dialog.open(ScheduledListDialogComponent, {
      data: { type: this.type() },
    });
  }

  protected sectionClass(section: Section): string {
    return this.section() === section
      ? 'flex items-center justify-center gap-1.5 rounded-xl bg-app-primary px-3 py-2 text-sm font-semibold text-app-primary-fg transition'
      : 'flex items-center justify-center gap-1.5 rounded-xl bg-app-secondary px-3 py-2 text-sm font-semibold text-app-secondary-fg transition hover:bg-app-secondary-hover';
  }

  protected sectionLabel(section: Section): TranslationKey {
    if (section === 'receivable') {
      return 'accounts.receivableTitle';
    }

    if (section === 'payable') {
      return 'accounts.payableTitle';
    }

    return 'nav.movements';
  }

  protected sectionIcon(section: Section): IconName {
    return SECTION_ICONS[section];
  }

  protected selectType(type: TransactionType): void {
    this.type.set(type);
  }

  protected backToTypes(): void {
    this.type.set(null);
  }

  protected selectedType(): TransactionType {
    return this.type() as TransactionType;
  }

  protected typeLabel(type: TransactionType): TranslationKey {
    return `movements.type.${type}` as TranslationKey;
  }
}
