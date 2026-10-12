import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { CONTACT_REPOSITORY } from '@app/features/master-data/data-access/contact.repository';
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
  private selfSync: Promise<void> = Promise.resolve();

  readonly contacts = this._contacts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly selfContact = computed(() => this._contacts().find((contact) => contact.isSelf === true));

  constructor() {
    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.reload());

    effect(() => {
      const completed = this.profile.completed();
      const name = this.profile.name().trim();

      this.scheduleSelfSync(completed, name);
    });
  }

  async load(): Promise<void> {
    await this.reload();
    await this.scheduleSelfSync(this.profile.completed(), this.profile.name().trim());
    this._loading.set(false);
  }

  private async reload(): Promise<void> {
    try {
      this._contacts.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }

  private scheduleSelfSync(completed: boolean, name: string): Promise<void> {
    this.selfSync = this.selfSync
      .then(() => this.applySelfContact(completed, name))
      .catch(() => undefined);

    return this.selfSync;
  }

  private async applySelfContact(completed: boolean, name: string): Promise<void> {
    if (!completed || name === '') {
      return;
    }

    const current = this.selfContact();

    if (current === undefined) {
      await this.create({ name, kind: 'person', gender: null, isSelf: true });
      return;
    }

    if (current.name !== name && current.id !== undefined) {
      await this.update({ ...current, name });
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
