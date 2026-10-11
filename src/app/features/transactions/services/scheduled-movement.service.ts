import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { ACCOUNT_REPOSITORY } from '@app/features/transactions/data-access/account.repository';
import { SCHEDULED_MOVEMENT_REPOSITORY } from '@app/features/transactions/data-access/scheduled-movement.repository';
import { TRANSACTION_REPOSITORY } from '@app/features/transactions/data-access/transaction.repository';
import {
  nextDueIso,
  occurrencesFrom,
  parseIsoDate,
} from '@app/features/transactions/utils/recurrence.utils';

import type { Account } from '@app/features/transactions/models/account.model';
import type {
  NewScheduledMovement,
  ScheduledMovement,
} from '@app/features/transactions/models/scheduled-movement.model';
import type { Transaction } from '@app/features/transactions/models/transaction.model';

function todayString(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
}

function localIso(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
}

@Injectable({
  providedIn: 'root',
})
export class ScheduledMovementService {
  private readonly repository = inject(SCHEDULED_MOVEMENT_REPOSITORY);
  private readonly transactionRepository = inject(TRANSACTION_REPOSITORY);
  private readonly accountRepository = inject(ACCOUNT_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _scheduled = signal<readonly ScheduledMovement[]>([]);

  readonly scheduled = this._scheduled.asReadonly();

  constructor() {
    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.reload());
  }

  async load(): Promise<void> {
    await this.reload();
  }

  async schedule(input: NewScheduledMovement): Promise<ScheduledMovement> {
    const item = await this.repository.add(input);

    await this.generateDue();

    return item;
  }

  async generateDue(): Promise<void> {
    try {
      const today = todayString();
      const due = await this.repository.findDue(today);

      for (const item of due) {
        await this.generateFor(item, today);
      }

      await this.reload();
    } catch (error) {
      console.warn('Could not generate scheduled movements', error);
    }
  }

  async toggle(id: number): Promise<void> {
    const item = (await this.repository.list()).find((entry) => entry.id === id);

    if (item === undefined) {
      return;
    }

    await this.repository.update({ ...item, active: !item.active });
    await this.reload();
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
    await this.reload();
  }

  private async generateFor(item: ScheduledMovement, today: string): Promise<void> {
    const dates = this.pendingDates(item, today);

    if (dates.length > 0) {
      if (item.accountType === undefined) {
        await this.generateTransactions(item, dates);
      } else {
        await this.generateAccounts(item, dates, item.accountType);
      }
    }

    await this.advance(item, today);
  }

  private async generateTransactions(
    item: ScheduledMovement,
    dates: readonly string[],
  ): Promise<void> {
    const existing = await this.transactionRepository.findOnDates(dates.map(parseIsoDate));
    const toCreate = dates.filter(
      (iso) => !existing.some((transaction) => this.isSameMovement(transaction, item, iso)),
    );

    if (toCreate.length === 0) {
      return;
    }

    await this.transactionRepository.bulkAdd(
      toCreate.map((iso) => ({
        type: item.type,
        categoryId: item.categoryId,
        contactId: item.contactId,
        date: parseIsoDate(iso),
        concept: item.concept,
        amount: item.amount,
        scheduledId: item.id,
      })),
    );
  }

  private async generateAccounts(
    item: ScheduledMovement,
    dates: readonly string[],
    accountType: NonNullable<ScheduledMovement['accountType']>,
  ): Promise<void> {
    const existing = await this.accountRepository.list();
    const toCreate = dates.filter(
      (iso) => !existing.some((account) => this.isSameAccount(account, item, iso)),
    );

    if (toCreate.length === 0) {
      return;
    }

    await this.accountRepository.bulkAdd(
      toCreate.map((iso) => ({
        type: accountType,
        categoryId: item.categoryId,
        contactId: item.contactId as number,
        concept: item.concept,
        amount: item.amount,
        dueDate: iso,
        status: 'pending' as const,
      })),
    );
  }

  private async advance(item: ScheduledMovement, today: string): Promise<void> {
    if (item.id === undefined) {
      return;
    }

    const recurrence = item.recurrence;

    if (recurrence === undefined || recurrence.kind === 'none') {
      await this.repository.remove(item.id);
      return;
    }

    const next =
      item.startDate > today
        ? item.startDate
        : nextDueIso(recurrence, item.startDate, parseIsoDate(today));

    if (next === undefined || next <= item.nextDate) {
      await this.repository.remove(item.id);
      return;
    }

    await this.repository.update({ ...item, nextDate: next });
  }

  private pendingDates(item: ScheduledMovement, today: string): readonly string[] {
    const dates: string[] = [item.startDate];
    const recurrence = item.recurrence;

    if (recurrence !== undefined && recurrence.kind !== 'none') {
      for (const iso of occurrencesFrom(recurrence, item.startDate, parseIsoDate(today))) {
        if (iso <= today) {
          dates.push(iso);
        }
      }
    }

    return dates.filter((iso) => iso >= item.nextDate && iso <= today);
  }

  private isSameMovement(transaction: Transaction, item: ScheduledMovement, iso: string): boolean {
    return (
      transaction.type === item.type &&
      Math.round(transaction.amount * 100) === Math.round(item.amount * 100) &&
      transaction.concept === item.concept &&
      localIso(transaction.date) === iso
    );
  }

  private isSameAccount(account: Account, item: ScheduledMovement, iso: string): boolean {
    return (
      account.type === item.accountType &&
      Math.round(account.amount * 100) === Math.round(item.amount * 100) &&
      account.concept === item.concept &&
      account.dueDate === iso
    );
  }

  private async reload(): Promise<void> {
    try {
      this._scheduled.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }
}
