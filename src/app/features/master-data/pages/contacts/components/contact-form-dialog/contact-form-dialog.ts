import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { I18nService } from '@app/core/i18n/i18n.service';
import { ContactForm } from '@app/features/master-data/pages/contacts/components/contact-form/contact-form';

import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import type { ContactKind } from '@app/features/master-data/models/contact-kind.model';
import type { Contact } from '@app/features/master-data/models/contact.model';

export interface ContactFormDialogData {
  readonly kind: ContactKind;
}

@Component({
  selector: 'app-contact-form-dialog',
  imports: [DialogShellComponent, ContactForm],
  template: `
    <app-dialog-shell [title]="title()">
      <app-contact-form [kind]="data.kind" (saved)="close($event)" />
    </app-dialog-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactFormDialogComponent {
  private readonly dialogRef = inject(DialogRef<Contact | undefined>);
  private readonly i18n = inject(I18nService);

  protected readonly data = inject<ContactFormDialogData>(DIALOG_DATA);

  protected readonly title = computed(() =>
    this.i18n.t(`contacts.submit.${this.data.kind}` as TranslationKey),
  );

  protected close(contact: Contact): void {
    this.dialogRef.close(contact);
  }
}
