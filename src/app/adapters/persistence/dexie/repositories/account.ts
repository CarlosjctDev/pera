import { Injectable, inject } from '@angular/core';

import { normalizeText } from '@app/core/utils/text.utils';

import type {
  AccountPageQuery,
  AccountPageResult,
  AccountRepository,
} from '@app/features/transactions/data-access/account.repository';

import type { Account, NewAccount } from '@app/features/transactions/models/account.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';
import type { Collection } from 'dexie';

function queryTerm(value: string | undefined): string {
  return normalizeText(value ?? '').toLowerCase();
}

@Injectable()
export class DexieAccountRepository implements AccountRepository {
  private readonly db = inject(AppDatabase);

  async list(): Promise<readonly Account[]> {
    return this.db.accounts.toArray();
  }

  async add(newAccount: NewAccount): Promise<Account> {
    const id = await this.db.accounts.add(newAccount);

    return { ...newAccount, id };
  }

  async bulkAdd(newAccounts: readonly NewAccount[]): Promise<readonly Account[]> {
    if (newAccounts.length === 0) {
      return [];
    }

    const ids = (await this.db.accounts.bulkAdd([...newAccounts], {
      allKeys: true,
    })) as readonly number[];

    return [...newAccounts].map((account, index) => ({ ...account, id: ids[index] }));
  }

  async update(account: Account): Promise<Account> {
    await this.db.accounts.put(account);

    return account;
  }

  async delete(id: number): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.accounts,
      this.db.attachments,
      this.db.notes,
      async () => {
        await this.db.attachments
          .filter((attachment) => attachment.ownerType === 'account' && attachment.ownerId === id)
          .delete();
        await this.db.notes
          .filter((note) => note.ownerType === 'account' && note.ownerId === id)
          .delete();
        await this.db.accounts.delete(id);
      },
    );
  }

  async queryPage(query: AccountPageQuery): Promise<AccountPageResult> {
    const { type, offset, limit, sort, search } = query;

    let collection: Collection<Account, number> = this.db.accounts.where('type').equals(type);

    const contactTerm = queryTerm(search?.contact);
    const conceptTerm = queryTerm(search?.concept);

    if (contactTerm !== '') {
      const contactIds = await this.db.contacts
        .filter((contact) => queryTerm(contact.name).includes(contactTerm))
        .keys();

      const ids = new Set(contactIds as readonly number[]);

      collection = collection.filter((account) => ids.has(account.contactId));
    }

    if (conceptTerm !== '') {
      collection = collection.filter((account) => queryTerm(account.concept).includes(conceptTerm));
    }

    const pendingTotal = await this.db.accounts
      .where('type')
      .equals(type)
      .filter((account) => account.status === 'pending')
      .toArray()
      .then((pending) => pending.reduce((sum, account) => sum + account.amount, 0));

    const total = await collection.count();

    let rows =
      sort !== null && sort !== undefined
        ? await collection.sortBy(sort.key)
        : await collection.toArray();

    if (sort?.dir === 'desc') {
      rows = [...rows].reverse();
    }

    if (limit !== -1) {
      rows = rows.slice(offset, offset + limit);
    }

    return { rows, total, pendingTotal };
  }
}
