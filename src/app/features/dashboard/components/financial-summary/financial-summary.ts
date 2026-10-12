import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';

import { Icon } from '@app/core/components/icons/icon.component';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { AccountService } from '@app/features/transactions/services/account.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';

import { DashboardPeriodService } from '../../services/dashboard-period.service';

import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';
import type { AccountType } from '@app/features/transactions/models/account.model';

@Component({
  selector: 'app-financial-summary',
  imports: [Icon, T, I18nCurrency],
  templateUrl: './financial-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialSummary implements OnInit {
  protected readonly period = inject(DashboardPeriodService);
  protected readonly profile = inject(ProfileService);

  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);

  protected readonly monthLabel = computed<TranslationKey>(
    () => `dashboard.months.${this.period.selectedMonth() - 1}` as TranslationKey,
  );

  protected readonly monthIncome = computed(() =>
    this.totalByType('income', (date) => this.inSelectedMonth(date)),
  );
  protected readonly monthExpense = computed(() =>
    this.totalByType('expense', (date) => this.inSelectedMonth(date)),
  );
  protected readonly monthSaving = computed(() =>
    this.totalByType('saving', (date) => this.inSelectedMonth(date)),
  );
  protected readonly monthBalance = computed(() =>
    this.monthIncome() - this.monthExpense() + this.monthSaving(),
  );

  protected readonly yearIncome = computed(() =>
    this.totalByType('income', (date) => this.inSelectedYear(date)),
  );
  protected readonly yearExpense = computed(() =>
    this.totalByType('expense', (date) => this.inSelectedYear(date)),
  );
  protected readonly yearSaving = computed(() =>
    this.totalByType('saving', (date) => this.inSelectedYear(date)),
  );
  protected readonly yearBalance = computed(() =>
    this.yearIncome() - this.yearExpense() + this.yearSaving(),
  );

  protected readonly pendingReceivable = computed(() => this.pendingTotal('receivable'));
  protected readonly pendingPayable = computed(() => this.pendingTotal('payable'));

  ngOnInit(): void {
    void this.transactionService.load();
    void this.accountService.load();
  }

  private inSelectedMonth(date: Date): boolean {
    return (
      date.getFullYear() === this.period.selectedYear() &&
      date.getMonth() + 1 === this.period.selectedMonth()
    );
  }

  private inSelectedYear(date: Date): boolean {
    return date.getFullYear() === this.period.selectedYear();
  }

  private totalByType(type: TransactionType, within: (date: Date) => boolean): number {
    return this.transactionService
      .transactions()
      .filter((transaction) => transaction.type === type && within(transaction.date))
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  private pendingTotal(type: AccountType): number {
    return this.accountService
      .accounts()
      .filter((account) => account.type === type && account.status === 'pending')
      .reduce((total, account) => total + account.amount, 0);
  }
}
