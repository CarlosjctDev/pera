import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { TRANSACTION_REPOSITORY } from '@app/features/transactions/data-access/transaction.repository';
import type {
  TransactionPageQuery,
  TransactionPageResult,
} from '@app/features/transactions/data-access/transaction.repository';

import type {
  NewTransaction,
  Transaction,
} from '@app/features/transactions/models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly repository = inject(TRANSACTION_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _transactions = signal<readonly Transaction[]>([]);
  private readonly _loading = signal(true);

  readonly transactions = this._transactions.asReadonly();
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
      this._transactions.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }

  async queryPage(query: TransactionPageQuery): Promise<TransactionPageResult> {
    return this.repository.queryPage(query);
  }

  async add(newTransaction: NewTransaction): Promise<Transaction> {
    const transaction = await this.repository.add(newTransaction);
    this._transactions.set([transaction, ...this._transactions()]);
    return transaction;
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
    this._transactions.set(this._transactions().filter((transaction) => transaction.id !== id));
  }

  async removeByAccountId(accountId: number): Promise<void> {
    await this.repository.removeByAccountId(accountId);
    this._transactions.set(
      this._transactions().filter((transaction) => transaction.accountId !== accountId),
    );
  }
}
