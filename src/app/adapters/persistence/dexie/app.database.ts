import Dexie, { type Table } from 'dexie';
import { EnvironmentService } from '@env/enviroment.service';

import type { Account } from '@app/features/transactions/models/account.model';
import type { Attachment } from '@app/features/attachments/models/attachment.model';
import type { Contact } from '@app/features/master-data/models/contact.model';
import type { RelationshipType } from '@app/features/master-data/models/relationship-type.model';
import type { Note } from '@app/features/notes/models/note.model';
import type { Profile } from '@app/features/profile/data-access/profile.repository';
import type { Category } from '@app/features/transactions/models/category.model';
import type { ScheduledMovement } from '@app/features/transactions/models/scheduled-movement.model';
import type { Transaction } from '@app/features/transactions/models/transaction.model';
import { inject } from '@angular/core';

export class AppDatabase extends Dexie {  
  profiles!: Table<Profile, number>;
  categories!: Table<Category, number>;
  transactions!: Table<Transaction, number>;
  relationshipTypes!: Table<RelationshipType, number>;
  contacts!: Table<Contact, number>;
  accounts!: Table<Account, number>;
  scheduledMovements!: Table<ScheduledMovement, number>;
  attachments!: Table<Attachment, number>;
  notes!: Table<Note, number>;

  constructor() {
    const env = inject(EnvironmentService);
    super(env.appName);

    this.version(1).stores({
      profiles: '++id, name, createdAt',
    });

    this.version(2).stores({
      profiles: '++id, name, createdAt',
      categories: '++id, type',
      transactions: '++id, type, categoryId, date',
    });

    this.version(3).stores({
      profiles: '++id, name, createdAt',
      categories: '++id, type',
      transactions: '++id, type, categoryId, date, contactId',
      relationshipTypes: '++id',
      contacts: '++id, name',
    });

    this.version(4).stores({
      profiles: '++id, name, createdAt',
      categories: '++id, type',
      transactions: '++id, type, categoryId, date, contactId',
      relationshipTypes: '++id',
      contacts: '++id, name',
      accounts: '++id, type',
    });

    this.version(5).stores({
      profiles: '++id, name, createdAt',
      categories: '++id, type',
      transactions: '++id, type, categoryId, date, contactId',
      relationshipTypes: '++id',
      contacts: '++id, name',
      accounts: '++id, type',
      scheduledMovements: '++id, nextDate',
    });

    this.version(6).stores({
      profiles: '++id, name, createdAt',
      categories: '++id, type',
      transactions: '++id, type, categoryId, date, contactId',
      relationshipTypes: '++id',
      contacts: '++id, name',
      accounts: '++id, type',
      scheduledMovements: '++id, nextDate',
      attachments: '++id, ownerId',
    });

    this.version(7).stores({
      profiles: '++id, name, createdAt',
      categories: '++id, type',
      transactions: '++id, type, categoryId, date, contactId',
      relationshipTypes: '++id',
      contacts: '++id, name',
      accounts: '++id, type',
      scheduledMovements: '++id, nextDate',
      attachments: '++id, ownerId',
      notes: '++id, ownerId, date',
    });

    this.version(8)
      .stores({
        profiles: '++id, name, createdAt',
        categories: '++id, type',
        transactions: '++id, type, categoryId, date, contactId',
        relationshipTypes: '++id',
        contacts: '++id, name',
        accounts: '++id, type',
        scheduledMovements: '++id, nextDate',
        attachments: '++id, ownerId',
        notes: '++id, ownerId, date',
      })
      .upgrade((tx) =>
        tx
          .table('contacts')
          .toCollection()
          .modify((contact: { isCompany?: boolean; kind?: string }) => {
            if (contact.kind === undefined) {
              contact.kind = contact.isCompany === true ? 'company' : 'person';
            }
            delete contact.isCompany;
          }),
      );
  }
}
