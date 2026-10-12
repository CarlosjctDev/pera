import { Injectable, inject } from '@angular/core';

import { normalizeText } from '@app/core/utils/text.utils';

import type {
  TransactionPageQuery,
  TransactionPageResult,
  TransactionRepository,
} from '@app/features/transactions/data-access/transaction.repository';

import type {
  NewTransaction,
  Transaction,
} from '@app/features/transactions/models/transaction.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';
import type { Collection } from 'dexie';

function queryTerm(value: string | undefined): string {
  return normalizeText(value ?? '').toLowerCase();
}

@Injectable()
export class DexieTransactionRepository implements TransactionRepository {
  private readonly db = inject(AppDatabase);

  async list(): Promise<readonly Transaction[]> {
    return this.db.transactions.orderBy('date').reverse().toArray();
  }

  async add(newTransaction: NewTransaction): Promise<Transaction> {
    const id = await this.db.transactions.add(newTransaction);

    return { ...newTransaction, id };
  }

  async bulkAdd(newTransactions: readonly NewTransaction[]): Promise<readonly Transaction[]> {
    if (newTransactions.length === 0) {
      return [];
    }

    const keys = (await this.db.transactions.bulkAdd(newTransactions, {
      allKeys: true,
    })) as number[];

    return newTransactions.map((transaction, index) => ({ ...transaction, id: keys[index] }));
  }

  async findOnDates(dates: readonly Date[]): Promise<readonly Transaction[]> {
    if (dates.length === 0) {
      return [];
    }

    return this.db.transactions.where('date').anyOf(dates as Date[]).toArray();
  }

  async delete(id: number): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.transactions,
      this.db.attachments,
      this.db.notes,
      async () => {
        await this.db.attachments
          .filter(
            (attachment) =>
              attachment.ownerType === 'transaction' && attachment.ownerId === id,
          )
          .delete();
        await this.db.notes
          .filter((note) => note.ownerType === 'transaction' && note.ownerId === id)
          .delete();
        await this.db.transactions.delete(id);
      },
    );
  }

  async removeByAccountId(accountId: number): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.transactions,
      this.db.attachments,
      this.db.notes,
      async () => {
        const ids = (await this.db.transactions
          .filter((transaction) => transaction.accountId === accountId)
          .keys()) as readonly number[];

        if (ids.length > 0) {
          const idSet = new Set(ids);
          await this.db.attachments
            .filter(
              (attachment) =>
                attachment.ownerType === 'transaction' && idSet.has(attachment.ownerId),
            )
            .delete();
          await this.db.notes
            .filter((note) => note.ownerType === 'transaction' && idSet.has(note.ownerId))
            .delete();
          await this.db.transactions.bulkDelete([...ids]);
        }
      },
    );
  }

  async queryPage(query: TransactionPageQuery): Promise<TransactionPageResult> {
    const { offset, limit, sort, search } = query;

    let collection: Collection<Transaction, number> = this.db.transactions.toCollection();

    const detailTerm = queryTerm(search?.detail);
    const contactTerm = queryTerm(search?.contact);

    if (contactTerm !== '') {
      const contactIds = await this.db.contacts
        .filter((contact) => queryTerm(contact.name).includes(contactTerm))
        .keys();

      const ids = new Set(contactIds as readonly number[]);

      collection = collection.filter(
        (transaction) => transaction.contactId !== undefined && ids.has(transaction.contactId),
      );
    }

    if (detailTerm !== '') {
      const categoryIds = new Set(
        (await this.db.categories.toArray())
          .filter((category) => queryTerm(category.name).includes(detailTerm))
          .map((category) => category.id),
      );

      collection = collection.filter(
        (transaction) =>
          queryTerm(transaction.concept).includes(detailTerm) ||
          (transaction.categoryId !== undefined && categoryIds.has(transaction.categoryId)),
      );
    }

    const total = await collection.count();

    const effectiveSort =
      sort !== null && sort !== undefined ? sort : { key: 'date', dir: 'desc' };

    let rows = await collection.sortBy(effectiveSort.key);

    if (effectiveSort.dir === 'desc') {
      rows = [...rows].reverse();
    }

    if (limit !== -1) {
      rows = rows.slice(offset, offset + limit);
    }

    return { rows, total };
  }
}
