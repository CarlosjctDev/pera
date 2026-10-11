import { InjectionToken } from '@angular/core';

import type {
  Attachment,
  AttachmentOwnerType,
  NewAttachment,
} from '@app/features/attachments/models/attachment.model';

export interface AttachmentOwner {
  readonly ownerType: AttachmentOwnerType;
  readonly ownerId: number;
}

export interface AttachmentRepository {
  list(): Promise<readonly Attachment[]>;
  addMany(newAttachments: readonly NewAttachment[]): Promise<readonly Attachment[]>;
  delete(id: number): Promise<void>;
  deleteByOwners(owners: readonly AttachmentOwner[]): Promise<void>;
}

export const ATTACHMENT_REPOSITORY = new InjectionToken<AttachmentRepository>(
  'ATTACHMENT_REPOSITORY',
);