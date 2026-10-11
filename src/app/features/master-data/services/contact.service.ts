import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { CONTACT_REPOSITORY } from '@app/features/master-data/data-access/contact.repository';

import type { Contact, NewContact } from '@app/features/master-data/models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly repository = inject(CONTACT_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _contacts = signal<readonly Contact[]>([]);
  private readonly _loading = signal(true);

  readonly contacts = this._contacts.asReadonly();
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
      this._contacts.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }

  async create(newContact: NewContact): Promise<Contact> {
    const contact = await this.repository.add(newContact);
    this._contacts.set([...this._contacts(), contact]);
    return contact;
  }

  async update(contact: Contact): Promise<void> {
    await this.repository.update(contact);
    this._contacts.set(
      this._contacts().map((current) => (current.id === contact.id ? contact : current)),
    );
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
    this._contacts.set(this._contacts().filter((contact) => contact.id !== id));
  }
}
