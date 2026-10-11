import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '@app/core/components/icons/icon.component';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { APP_ROUTES } from '@app/core/routing/app.routing';
import { AccountService } from '@app/features/transactions/services/account.service';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { RelationshipTypeService } from '@app/features/master-data/services/relationship-type.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';
import { ContactKindCards } from '@app/features/master-data/pages/contacts/components/contact-kind-cards/contact-kind-cards';
import { ContactForm } from '@app/features/master-data/pages/contacts/components/contact-form/contact-form';
import { ContactList } from '@app/features/master-data/pages/contacts/components/contact-list/contact-list';

import type { ContactKind } from '@app/features/master-data/models/contact-kind.model';

@Component({
  selector: 'app-master-contacts',
  imports: [RouterLink, Icon, T, TippyDirective, ContactKindCards, ContactForm, ContactList],
  templateUrl: './contacts.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contacts {
  private readonly contactService = inject(ContactService);
  private readonly relationshipTypeService = inject(RelationshipTypeService);
  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);

  protected readonly kind = signal<ContactKind | null>(null);

  protected readonly masterDataUrl = '/' + APP_ROUTES.masterData.path;

  ngOnInit(): void {
    void this.contactService.load();
    void this.relationshipTypeService.load();
    void this.transactionService.load();
    void this.accountService.load();
  }

  protected selectKind(kind: ContactKind): void {
    this.kind.set(kind);
  }

  protected backToKinds(): void {
    this.kind.set(null);
  }

  protected selectedKind(): ContactKind {
    return this.kind() as ContactKind;
  }

  protected kindLabel(kind: ContactKind): TranslationKey {
    return `contacts.kind.${kind}` as TranslationKey;
  }
}
