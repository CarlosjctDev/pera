import { Injectable, inject } from '@angular/core';

import type { AttachmentRepository } from '@app/features/attachments/data-access/attachment.repository';
import type {
  AttachmentOwner,
} from '@app/features/attachments/data-access/attachment.repository';

import type {
  Attachment,
  NewAttachment,
} from '@app/features/attachments/models/attachment.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';

@Injectable()
export class DexieAttachmentRepository implements AttachmentRepository {
  private readonly db = inject(AppDatabase);

  async list(): Promise<readonly Attachment[]> {
    return this.db.attachments.toArray();
  }

  async addMany(newAttachments: readonly NewAttachment[]): Promise<readonly Attachment[]> {
    if (newAttachments.length === 0) {
      return [];
    }

    const keys = (await this.db.attachments.bulkAdd([...newAttachments], {
      allKeys: true,
    })) as readonly number[];

    return [...newAttachments].map((attachment, index) => ({
      ...attachment,
      id: keys[index] as number,
    }));
  }

  async delete(id: number): Promise<void> {
    await this.db.attachments.delete(id);
  }

  async deleteByOwners(owners: readonly AttachmentOwner[]): Promise<void> {
    if (owners.length === 0) {
      return;
    }

    const ownerKeys = new Set(owners.map(({ ownerType, ownerId }) => `${ownerType}:${ownerId}`));

    await this.db.attachments
      .filter(
        (attachment) => ownerKeys.has(`${attachment.ownerType}:${attachment.ownerId}`),
      )
      .delete();
  }
}