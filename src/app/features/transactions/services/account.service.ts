import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { ACCOUNT_REPOSITORY } from '@app/features/transactions/data-access/account.repository';
import type {
  AccountPageQuery,
  AccountPageResult,
} from '@app/features/transactions/data-access/account.repository';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';
import { parseIsoDate } from '@app/features/transactions/utils/recurrence.utils';

import type { Account, NewAccount } from '@app/features/transactions/models/account.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly repository = inject(ACCOUNT_REPOSITORY);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _accounts = signal<readonly Account[]>([]);
  private readonly _loading = signal(true);

  readonly accounts = this._accounts.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.reload());
  }

  async load(): Promise<void> {
    await this.reload();
    this._loading.set(false);
  }

  private async reload(): Promise<void> {
    try {
      this._accounts.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }

  async queryPage(query: AccountPageQuery): Promise<AccountPageResult> {
    return this.repository.queryPage(query);
  }

  async create(newAccount: NewAccount): Promise<Account> {
    const account = await this.repository.add(newAccount);
    this._accounts.set([...this._accounts(), account]);
    return account;
  }

  async update(account: Account): Promise<void> {
    await this.repository.update(account);
    this._accounts.set(
      this._accounts().map((current) => (current.id === account.id ? account : current)),
    );
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
    this._accounts.set(this._accounts().filter((account) => account.id !== id));
    await this.transactionService.removeByAccountId(id);
  }

  async pay(account: Account): Promise<void> {
    if (account.id === undefined || account.status === 'paid') {
      return;
    }

    const categoryId = account.categoryId ?? (await this.categoryService.ensureDefaultCategory());

    await this.repository.update({
      ...account,
      categoryId,
      status: 'paid',
    });

    await this.transactionService.add({
      type: account.type === 'receivable' ? 'income' : 'expense',
      categoryId,
      contactId: account.contactId,
      date: account.dueDate ? parseIsoDate(account.dueDate) : new Date(),
      concept: account.concept,
      amount: account.amount,
      accountId: account.id,
    });

    await this.reload();
  }
}
