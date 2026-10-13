import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { CONTACT_REPOSITORY } from '@app/features/master-data/data-access/contact.repository';
import { SELF_CONTACT_ID } from '@app/features/master-data/models/contact.model';
import { ProfileService } from '@app/features/profile/services/profile.service';

import type { Contact, NewContact } from '@app/features/master-data/models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly repository = inject(CONTACT_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly profile = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _contacts = signal<readonly Contact[]>([]);
  private readonly _loading = signal(true);

  readonly loading = this._loading.asReadonly();
  readonly selfContact = computed<Contact | undefined>(() => {
    const name = this.profile.name().trim();

    if (!this.profile.completed() || name === '') {
      return undefined;
    }

    return { id: SELF_CONTACT_ID, name, kind: 'person', gender: null, isSelf: true };
  });

  readonly contacts = computed<readonly Contact[]>(() => {
    const self = this.selfContact();

    return self === undefined ? this._contacts() : [...this._contacts(), self];
  });

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
