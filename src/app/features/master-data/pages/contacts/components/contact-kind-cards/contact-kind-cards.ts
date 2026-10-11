import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';

import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import { Bytes } from '@app/core/i18n/pipes/bytes.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { estimateBytes } from '@app/core/utils/size.utils';
import { ContactService } from '@app/features/master-data/services/contact.service';

import type { TranslationKey } from '@app/core/i18n/i18n.keys';

type ContactKind = 'person' | 'company';

@Component({
  selector: 'app-contact-kind-cards',
  imports: [Icon, T, Bytes],
  templateUrl: './contact-kind-cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactKindCards {
  protected readonly contactService = inject(ContactService);

  @Output() readonly select = new EventEmitter<ContactKind>();

  protected readonly kinds: readonly ContactKind[] = ['person', 'company'];

  protected kindKindDescription(kind: ContactKind): TranslationKey {
    return `contacts.kindDescription.${kind}` as TranslationKey;
  }

  protected kindCount(kind: ContactKind): number {
    return this.contactService
      .contacts()
      .filter((contact) => contact.isCompany === (kind === 'company')).length;
  }

  protected kindSize(kind: ContactKind): number {
    return estimateBytes(
      this.contactService
        .contacts()
        .filter((contact) => contact.isCompany === (kind === 'company')),
    );
  }

  protected kindIcon(kind: ContactKind): IconName {
    return kind === 'company' ? 'users' : 'user';
  }

  protected kindLabel(kind: ContactKind): TranslationKey {
    return `contacts.kind.${kind}` as TranslationKey;
  }
}
