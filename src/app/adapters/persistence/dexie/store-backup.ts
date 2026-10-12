import { Injectable, inject } from '@angular/core';

import { STORE_SCHEMA_VERSION } from '@app/core/data/store-snapshot';

import type { DataStoreBackup } from '@app/core/data/data-store-backup';
import type {
  AccountSnapshot,
  AttachmentSnapshot,
  CategorySnapshot,
  ContactSnapshot,
  NoteSnapshot,
  ProfileSnapshot,
  RelationshipTypeSnapshot,
  ScheduledMovementSnapshot,
  StoreSnapshot,
  TransactionSnapshot,
} from '@app/core/data/store-snapshot';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';

import type { Account } from '@app/features/transactions/models/account.model';
import type { Attachment } from '@app/features/attachments/models/attachment.model';
import type { Category } from '@app/features/transactions/models/category.model';
import type { Contact } from '@app/features/master-data/models/contact.model';
import type { RelationshipType } from '@app/features/master-data/models/relationship-type.model';
import type { Note } from '@app/features/notes/models/note.model';
import type { ScheduledMovement } from '@app/features/transactions/models/scheduled-movement.model';
import { EnvironmentService } from '@env/enviroment.service';

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toDate(value: string): Date {
  return new Date(value);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

@Injectable()
export class DexieStoreBackup implements DataStoreBackup {
  readonly schemaVersion = STORE_SCHEMA_VERSION;
  private readonly env = inject(EnvironmentService);

  private readonly db = inject(AppDatabase);

  async exportSnapshot(): Promise<StoreSnapshot> {
    const [
      profiles,
      categories,
      transactions,
      relationshipTypes,
      contacts,
      accounts,
      scheduledMovements,
      attachments,
      notes,
    ] = await Promise.all([
      this.db.profiles.toArray(),
      this.db.categories.toArray(),
      this.db.transactions.toArray(),
      this.db.relationshipTypes.toArray(),
      this.db.contacts.toArray(),
      this.db.accounts.toArray(),
      this.db.scheduledMovements.toArray(),
      this.db.attachments.toArray(),
      this.db.notes.toArray(),
    ]);

    return {
      app: this.env.appName,
      version: this.db.verno,
      exportedAt: new Date().toISOString(),
      profileName: profiles[0]?.name,
      tables: {
        profiles: profiles.map(({ id, name, currency, createdAt }): ProfileSnapshot => ({
          id: id as number,
          name,
          currency,
          createdAt: toIso(createdAt),
        })),
        categories: categories.map(({ id, name, type }): CategorySnapshot => ({
          id: id as number,
          name,
          type,
        })),
        transactions: transactions.map(
          ({
            id,
            type,
            categoryId,
            contactId,
            date,
            concept,
            amount,
            scheduledId,
            accountId,
          }): TransactionSnapshot => ({
            id: id as number,
            type,
            categoryId,
            contactId,
            date: toIso(date),
            concept,
            amount,
            scheduledId,
            accountId,
          }),
        ),
        relationshipTypes: relationshipTypes.map(({ id, name }): RelationshipTypeSnapshot => ({
          id: id as number,
          name,
        })),
        contacts: contacts.map(
          ({ id, name, kind, gender, relationshipTypeId, isSelf }): ContactSnapshot => ({
            id: id as number,
            name,
            kind,
            gender,
            relationshipTypeId,
            isSelf,
          }),
        ),
        accounts: accounts.map(
          ({ id, type, categoryId, contactId, concept, amount, dueDate, status }): AccountSnapshot => ({
            id: id as number,
            type,
            categoryId,
            contactId,
            concept,
            amount,
            dueDate,
            status,
          }),
        ),
        scheduledMovements: scheduledMovements.map(
          ({
            id,
            type,
            accountType,
            categoryId,
            contactId,
            concept,
            amount,
            startDate,
            recurrence,
            nextDate,
            active,
          }): ScheduledMovementSnapshot => ({
            id: id as number,
            type,
            accountType,
            categoryId,
            contactId,
            concept,
            amount,
            startDate,
            recurrence,
            nextDate,
            active,
          }),
        ),
        attachments: await Promise.all(
          attachments.map(
            async ({ id, ownerType, ownerId, name, mimeType, size, data }): Promise<AttachmentSnapshot> => ({
              id: id as number,
              ownerType,
              ownerId,
              name,
              mimeType,
              size,
              data: await blobToBase64(data),
            }),
          ),
        ),
        notes: notes.map(({ id, ownerType, ownerId, date, text }): NoteSnapshot => ({
          id: id as number,
          ownerType,
          ownerId,
          date,
          text,
        })),
      },
    };
  }

  async importSnapshot(snapshot: StoreSnapshot): Promise<void> {
    const {
      profiles,
      categories,
      transactions,
      relationshipTypes,
      contacts,
      accounts,
      scheduledMovements,
      attachments,
      notes,
    } = snapshot.tables;

    await this.db.transaction(
      'rw',
      [
        this.db.profiles,
        this.db.categories,
        this.db.transactions,
        this.db.relationshipTypes,
        this.db.contacts,
        this.db.accounts,
        this.db.scheduledMovements,
        this.db.attachments,
        this.db.notes,
      ],
      async () => {
        await Promise.all([
          this.db.profiles.clear(),
          this.db.categories.clear(),
          this.db.transactions.clear(),
          this.db.relationshipTypes.clear(),
          this.db.contacts.clear(),
          this.db.accounts.clear(),
          this.db.scheduledMovements.clear(),
          this.db.attachments.clear(),
          this.db.notes.clear(),
        ]);

        if (profiles.length > 0) {
          await this.db.profiles.bulkPut(
            profiles.map(({ id, name, currency, createdAt }) => ({
              id,
              name,
              currency,
              createdAt: toDate(createdAt),
            })),
          );
        }

        if (categories.length > 0) {
          await this.db.categories.bulkPut(categories as readonly Category[]);
        }

        if (transactions.length > 0) {
          await this.db.transactions.bulkPut(
            transactions.map(
              ({
                id,
                type,
                categoryId,
                contactId,
                date,
                concept,
                amount,
                scheduledId,
                accountId,
              }) => ({
                id,
                type,
                categoryId,
                contactId,
                date: toDate(date),
                concept,
                amount,
                scheduledId,
                accountId,
              }),
            ),
          );
        }

        if (relationshipTypes.length > 0) {
          await this.db.relationshipTypes.bulkPut(relationshipTypes as readonly RelationshipType[]);
        }

        if (contacts.length > 0) {
          await this.db.contacts.bulkPut(contacts as readonly Contact[]);
        }

        if (accounts.length > 0) {
          await this.db.accounts.bulkPut(accounts as readonly Account[]);
        }

        if (scheduledMovements.length > 0) {
          await this.db.scheduledMovements.bulkPut(
            scheduledMovements.map(
              ({
                id,
                type,
                accountType,
                categoryId,
                contactId,
                concept,
                amount,
                startDate,
                recurrence,
                nextDate,
                active,
              }) => ({
                id,
                type,
                accountType,
                categoryId,
                contactId,
                concept,
                amount,
                startDate,
                recurrence,
                nextDate,
                active,
              }),
            ),
          );
        }

        if (attachments.length > 0) {
          await this.db.attachments.bulkPut(
            attachments.map(
              ({ id, ownerType, ownerId, name, mimeType, size, data }): Attachment => ({
                id,
                ownerType,
                ownerId,
                name,
                mimeType,
                size,
                data: base64ToBlob(data, mimeType),
              }),
            ),
          );
        }

        if (notes.length > 0) {
          await this.db.notes.bulkPut(notes as readonly Note[]);
        }
      },
    );
  }

  async wipe(): Promise<void> {
    await this.db.delete();
    await this.db.open();
  }
}
