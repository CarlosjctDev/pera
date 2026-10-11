import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { Icon } from '@app/core/components/icons/icon.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { Bytes } from '@app/core/i18n/pipes/bytes.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';

import {
  isAllowedAttachmentMimeType,
  isPdfAttachment,
} from '@app/features/attachments/models/attachment.model';

export type PendingAttachment = {
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  readonly data: Blob;
};

@Component({
  selector: 'app-attachment-picker',
  imports: [Icon, T, Bytes],
  templateUrl: './attachment-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentPicker {
  readonly disabled = input(false);

  private readonly toastr = inject(ToastrService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly files = signal<readonly PendingAttachment[]>([]);
  protected readonly count = computed(() => this.files().length);

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);

    const rejected = selected.some((file) => !isAllowedAttachmentMimeType(file.type));

    if (rejected) {
      this.toastr.error('attachments.onlyPdfImages');
    }

    const accepted = selected
      .filter((file) => isAllowedAttachmentMimeType(file.type))
      .map((file): PendingAttachment => ({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        data: file,
      }));

    if (accepted.length > 0) {
      this.files.set([...this.files(), ...accepted]);
    }

    input.value = '';
  }

  protected openPicker(): void {
    if (!this.disabled()) {
      this.fileInput()?.nativeElement.click();
    }
  }

  protected remove(index: number): void {
    this.files.set(this.files().filter((_, current) => current !== index));
  }

  protected isPdf(mimeType: string): boolean {
    return isPdfAttachment(mimeType);
  }

  pending(): readonly PendingAttachment[] {
    return this.files();
  }

  clear(): void {
    this.files.set([]);
  }
}