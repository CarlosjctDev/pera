import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { ThemeService } from '@app/core/components/theme/services/theme.service';
import { Bytes } from '@app/core/i18n/pipes/bytes.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';

import { isPdfAttachment } from '@app/features/attachments/models/attachment.model';

import type { Attachment } from '@app/features/attachments/models/attachment.model';

@Component({
  selector: 'app-attachment-preview-dialog',
  imports: [DialogShellComponent, T, Icon, Bytes, NgxExtendedPdfViewerModule],
  templateUrl: './attachment-preview-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentPreviewDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(DialogRef<void>);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly themeService = inject(ThemeService);

  private readonly viewerHost = viewChild.required<ElementRef<HTMLElement>>('viewerHost');

  protected readonly attachment = inject<Attachment>(DIALOG_DATA);

  protected readonly viewerTheme = this.themeService.resolved;
  protected readonly isFullscreen = signal(false);
  protected readonly pdfData = signal<Uint8Array | undefined>(undefined);
  protected readonly imageUrl = signal<string | undefined>(undefined);

  protected readonly hostClass = computed(() =>
    this.isFullscreen() ? 'flex h-screen w-screen flex-col gap-3 bg-app-bg p-4' : '',
  );

  protected readonly viewerBoxClass = computed(() =>
    this.isFullscreen()
      ? 'flex-1 min-h-0 overflow-hidden rounded-xl bg-app-secondary/50 ring-1 ring-app-border'
      : 'h-[70vh] overflow-hidden rounded-xl bg-app-secondary/50 ring-1 ring-app-border',
  );

  ngOnInit(): void {
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    void this.prepare();
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);

    const imageUrl = this.imageUrl();

    if (imageUrl !== undefined) {
      URL.revokeObjectURL(imageUrl);
    }
  }

  protected previewImageUrl(): SafeResourceUrl | undefined {
    const imageUrl = this.imageUrl();

    return imageUrl !== undefined
      ? this.sanitizer.bypassSecurityTrustResourceUrl(imageUrl)
      : undefined;
  }

  protected isPdf(): boolean {
    return isPdfAttachment(this.attachment.mimeType);
  }

  protected download(): void {
    const url = URL.createObjectURL(this.attachment.data);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = this.attachment.name;
    anchor.rel = 'noopener';
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url));
  }

  protected async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement !== null) {
      await document.exitFullscreen();
      return;
    }

    await this.viewerHost().nativeElement.requestFullscreen();
  }

  protected close(): void {
    this.dialogRef.close();
  }

  private readonly onFullscreenChange = (): void => {
    this.isFullscreen.set(document.fullscreenElement !== null);
  };

  private async prepare(): Promise<void> {
    if (this.isPdf()) {
      this.pdfData.set(new Uint8Array(await this.attachment.data.arrayBuffer()));
    } else {
      this.imageUrl.set(URL.createObjectURL(this.attachment.data));
    }
  }
}