import { InjectionToken } from '@angular/core';

import type { Contact, NewContact } from '@app/features/master-data/models/contact.model';

export interface ContactRepository {
  list(): Promise<readonly Contact[]>;
  add(newContact: NewContact): Promise<Contact>;
  update(contact: Contact): Promise<Contact>;
  delete(id: number): Promise<void>;
}

export const CONTACT_REPOSITORY = new InjectionToken<ContactRepository>('CONTACT_REPOSITORY');
