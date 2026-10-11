import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { Bytes } from '@app/core/i18n/pipes/bytes.pipe';
import { I18nService } from '@app/core/i18n/i18n.service';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { AttachmentService } from '@app/features/attachments/services/attachment.service';
import { AttachmentPreviewDialogComponent } from '@app/features/attachments/components/attachment-preview-dialog/attachment-preview-dialog';
import { isAllowedAttachmentMimeType, isPdfAttachment } from '@app/features/attachments/models/attachment.model';

import type { AttachmentOwnerType } from '@app/features/attachments/models/attachment.model';
import type { Attachment } from '@app/features/attachments/models/attachment.model';

export interface AttachmentListData {
  readonly ownerType: AttachmentOwnerType;
  readonly ownerId: number;
}

@Component({
  selector: 'app-attachment-list-dialog',
  imports: [DialogShellComponent, Icon, T, TippyDirective, Bytes],
  templateUrl: './attachment-list-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentListDialogComponent implements OnInit {
  private readonly dialogRef = inject(DialogRef<void>);
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly toastr = inject(ToastrService);
  private readonly attachmentService = inject(AttachmentService);

  private readonly data = inject<AttachmentListData>(DIALOG_DATA);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly saving = signal(false);
  protected readonly rows = computed(() => {
    const ownerId = this.data.ownerId;

    return this.attachmentService.byOwner(this.data.ownerType, ownerId);
  });

  ngOnInit(): void {
    void this.attachmentService.load();
  }

  protected async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);

    const rejected = selected.some((file) => !isAllowedAttachmentMimeType(file.type));

    if (rejected) {
      this.toastr.error('attachments.onlyPdfImages');
    }

    const accepted = selected.filter((file) => isAllowedAttachmentMimeType(file.type));

    input.value = '';

    if (accepted.length === 0) {
      return;
    }

    this.saving.set(true);

    try {
      const created = await this.attachmentService.addMany(
        accepted.map((file) => ({
          ownerType: this.data.ownerType,
          ownerId: this.data.ownerId,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          data: file,
        })),
      );

      if (created.length > 0) {
        this.toastr.success('attachments.added');
      }
    } catch {
      this.toastr.error('toasts.saveError');
    } finally {
      this.saving.set(false);
    }
  }

  protected openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected isPdf(mimeType: string): boolean {
    return isPdfAttachment(mimeType);
  }

  protected view(attachment: Attachment): void {
    this.dialog.open(AttachmentPreviewDialogComponent, {
      data: attachment,
    });
  }

  protected confirmDelete(attachment: Attachment): void {
    if (attachment.id === undefined) {
      return;
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('attachments.deleteConfirmTitle'),
        message: this.i18n.t('attachments.deleteConfirmMessage'),
        confirmLabel: this.i18n.t('common.confirm'),
        cancelLabel: this.i18n.t('common.cancel'),
        variant: 'danger',
      },
    });

    dialogRef.closed.subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      try {
        await this.attachmentService.delete(attachment.id as number);
        this.toastr.success('attachments.deleted');
      } catch {
        this.toastr.error('toasts.deleteError');
      }
    });
  }

  protected close(): void {
    this.dialogRef.close();
  }
}