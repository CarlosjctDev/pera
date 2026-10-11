import { Injectable, inject } from '@angular/core';

import {
  CONTACT_REPOSITORY,
  type ContactRepository,
} from '@app/features/master-data/data-access/contact.repository';

import type { Contact, NewContact } from '@app/features/master-data/models/contact.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';

@Injectable()
export class DexieContactRepository implements ContactRepository {
  private readonly db = inject(AppDatabase);

  async list(): Promise<readonly Contact[]> {
    return this.db.contacts.toArray();
  }

  async add(newContact: NewContact): Promise<Contact> {
    const id = await this.db.contacts.add(newContact);

    return { ...newContact, id };
  }

  async update(contact: Contact): Promise<Contact> {
    await this.db.contacts.put(contact);

    return contact;
  }

  async delete(id: number): Promise<void> {
    await this.db.transaction('rw', this.db.contacts, this.db.transactions, async () => {
      await this.db.transactions.where('contactId').equals(id).modify({ contactId: undefined });
      await this.db.contacts.delete(id);
    });
  }
}
