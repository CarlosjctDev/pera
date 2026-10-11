import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { ATTACHMENT_REPOSITORY } from '@app/features/attachments/data-access/attachment.repository';
import type {
  AttachmentOwner,
} from '@app/features/attachments/data-access/attachment.repository';

import type {
  Attachment,
  NewAttachment,
} from '@app/features/attachments/models/attachment.model';

@Injectable({
  providedIn: 'root',
})
export class AttachmentService {
  private readonly repository = inject(ATTACHMENT_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _attachments = signal<readonly Attachment[]>([]);
  private readonly _loading = signal(true);

  readonly attachments = this._attachments.asReadonly();
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

  async addMany(newAttachments: readonly NewAttachment[]): Promise<readonly Attachment[]> {
    if (newAttachments.length === 0) {
      return [];
    }

    const created = await this.repository.addMany(newAttachments);
    this._attachments.set([...this._attachments(), ...created]);
    return created;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
    this._attachments.set(this._attachments().filter((attachment) => attachment.id !== id));
  }

  async deleteByOwners(owners: readonly AttachmentOwner[]): Promise<void> {
    if (owners.length === 0) {
      return;
    }

    await this.repository.deleteByOwners(owners);
    this._attachments.set(
      this._attachments().filter(
        (attachment) =>
          !owners.some(
            (owner) =>
              owner.ownerId === attachment.ownerId && owner.ownerType === attachment.ownerType,
          ),
      ),
    );
  }

  byOwner(ownerType: Attachment['ownerType'], ownerId: number): readonly Attachment[] {
    const id = ownerId;

    return this._attachments().filter(
      (attachment) => attachment.ownerType === ownerType && attachment.ownerId === id,
    );
  }

  private async reload(): Promise<void> {
    try {
      this._attachments.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }
}