import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import type { TemplateRef } from '@angular/core';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import { SelectComponent } from '@app/core/components/select/select.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { DataTable } from '@app/core/components/table/data-table';
import type { DataColumn } from '@app/core/components/table/data-table.model';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { I18nService } from '@app/core/i18n/i18n.service';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';
import { AccountService } from '@app/features/transactions/services/account.service';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { MasterDataDialogsService } from '@app/features/master-data/services/master-data-dialogs.service';
import { RelationshipTypeService } from '@app/features/master-data/services/relationship-type.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';

import type { ContactKind } from '@app/features/master-data/models/contact-kind.model';
import type { Contact, Gender } from '@app/features/master-data/models/contact.model';
import type { RelationshipType } from '@app/features/master-data/models/relationship-type.model';

const GENDERS: readonly Gender[] = ['male', 'female', 'non_binary', 'prefer_not_to_say', 'other'];

@Component({
  selector: 'app-contact-list',
  imports: [FormsModule, Icon, SelectComponent, T, TippyDirective, DataTable],
  templateUrl: './contact-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactList {
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly contactService = inject(ContactService);
  private readonly relationshipTypeService = inject(RelationshipTypeService);
  private readonly masterDialogs = inject(MasterDataDialogsService);
  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);
  private readonly toastr = inject(ToastrService);

  readonly kind = input.required<ContactKind>();

  protected readonly loading = this.contactService.loading;
  protected readonly relationshipTypes = this.relationshipTypeService.relationshipTypes;
  protected readonly genders: readonly Gender[] = GENDERS;

  protected readonly relationshipOptions = computed(() =>
    this.relationshipTypes().map((type) => ({ value: type.id ?? null, label: type.name })),
  );

  protected readonly contactsForKind = computed(() =>
    this.contactService.contacts().filter((contact) => contact.kind === this.kind()),
  );

  protected readonly relationshipTypeById = computed(() => {
    const map = new Map<number, RelationshipType>();
    for (const relationshipType of this.relationshipTypes()) {
      if (relationshipType.id !== undefined) {
        map.set(relationshipType.id, relationshipType);
      }
    }
    return map;
  });

  protected readonly inUse = computed(() => {
    const ids: number[] = [];

    for (const transaction of this.transactionService.transactions()) {
      if (transaction.contactId !== undefined) {
        ids.push(transaction.contactId);
      }
    }

    for (const account of this.accountService.accounts()) {
      ids.push(account.contactId);
    }

    return new Set(ids);
  });

  private readonly nameCell = viewChild<TemplateRef<unknown>>('nameCell');
  private readonly kindCell = viewChild<TemplateRef<unknown>>('kindCell');
  private readonly genderCell = viewChild<TemplateRef<unknown>>('genderCell');
  private readonly actionsCell = viewChild<TemplateRef<unknown>>('actionsCell');
  protected readonly editRow = viewChild<TemplateRef<unknown>>('editCell');

  protected readonly columns = computed<readonly DataColumn<Contact>[]>(() => {
    const nameCell = this.nameCell();
    const kindCell = this.kindCell();
    const genderCell = this.genderCell();
    const actionsCell = this.actionsCell();

    if (
      nameCell === undefined ||
      kindCell === undefined ||
      genderCell === undefined ||
      actionsCell === undefined
    ) {
      return [];
    }

    return [
      {
        key: 'name',
        labelKey: 'contacts.name',
        searchable: true,
        sortable: true,
        cellTemplate: nameCell,
      },
      { key: 'kind', labelKey: 'contacts.kindLabel', cellTemplate: kindCell },
      { key: 'gender', labelKey: 'contacts.gender', cellTemplate: genderCell },
      {
        key: 'relationship',
        labelKey: 'contacts.relationship',
        render: (contact) => this.relationshipLabel(contact.relationshipTypeId) ?? '',
      },
      {
        key: 'actions',
        labelKey: 'common.actions',
        align: 'right',
        widthClass: 'w-20',
        cellTemplate: actionsCell,
      },
    ];
  });

  protected readonly editingId = signal<number | null>(null);
  protected readonly editName = signal('');
  protected readonly editKind = signal<ContactKind>('person');
  protected readonly editGender = signal<Gender | null>(null);
  protected readonly editRelationshipTypeId = signal<number | null>(null);
  protected readonly editDuplicate = signal(false);
  protected readonly editGenderError = signal(false);

  protected startEdit(contact: Contact): void {
    if (contact.id === undefined) {
      return;
    }

    this.editingId.set(contact.id);
    this.editName.set(contact.name);
    this.editKind.set(contact.kind);
    this.editGender.set(contact.gender ?? null);
    this.editRelationshipTypeId.set(contact.relationshipTypeId ?? null);
    this.editDuplicate.set(false);
    this.editGenderError.set(false);
  }

  protected async saveEdit(contact: Contact): Promise<void> {
    const name = normalizeText(this.editName());

    if (!name) {
      this.cancelEdit();
      return;
    }

    if (this.nameExists(name, contact.id)) {
      this.editDuplicate.set(true);
      return;
    }

    if (contact.id === undefined) {
      this.cancelEdit();
      return;
    }

    const gender = this.editKind() === 'person' ? this.editGender() : null;

    if (this.editKind() === 'person' && gender === null) {
      this.editGenderError.set(true);
      return;
    }

    await this.contactService.update({
      id: contact.id,
      name,
      kind: this.editKind(),
      gender,
      relationshipTypeId: this.editRelationshipTypeId() ?? undefined,
    });
    this.cancelEdit();
    this.toastr.success('toasts.updated');
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editName.set('');
    this.editDuplicate.set(false);
    this.editGender.set(null);
    this.editGenderError.set(false);
  }

  protected readonly isEditing = (contact: Contact): boolean =>
    contact.id !== undefined && this.editingId() === contact.id;

  protected selectEditKind(kind: ContactKind): void {
    this.editKind.set(kind);

    if (kind !== 'person') {
      this.editGender.set(null);
      this.editGenderError.set(false);
    }
  }

  protected selectEditGender(gender: Gender): void {
    this.editGender.set(gender);
    this.editGenderError.set(false);
  }

  protected onEditRelationshipChange(value: number | null): void {
    this.editRelationshipTypeId.set(typeof value === 'number' ? value : null);
  }

  protected async addRelationshipType(): Promise<void> {
    const relationshipType = await this.masterDialogs.addRelationshipType();

    if (relationshipType?.id !== undefined) {
      this.editRelationshipTypeId.set(relationshipType.id);
    }
  }

  protected confirmDelete(contact: Contact): void {
    if (contact.id === undefined || this.isInUse(contact.id)) {
      return;
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('contacts.deleteConfirmTitle'),
        message: this.i18n.t('contacts.deleteConfirmMessage'),
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
        await this.contactService.remove(contact.id as number);
        this.toastr.success('toasts.deleted');
      } catch {
        this.toastr.error('toasts.deleteError');
      }
    });
  }

  protected isInUse(id: number | undefined): boolean {
    return id === undefined ? false : this.inUse().has(id);
  }

  protected editKindClass(kind: ContactKind): string {
    return this.editKind() === kind
      ? 'flex items-center justify-center gap-1 rounded-lg bg-app-primary px-2.5 py-1 text-xs font-semibold text-app-primary-fg transition'
      : 'flex items-center justify-center gap-1 rounded-lg bg-app-secondary px-2.5 py-1 text-xs font-semibold text-app-secondary-fg transition hover:bg-app-secondary-hover';
  }

  protected editGenderClass(gender: Gender): string {
    return this.editGender() === gender
      ? 'flex items-center justify-center rounded-lg bg-app-primary px-2.5 py-1 text-xs font-semibold text-app-primary-fg transition'
      : 'flex items-center justify-center rounded-lg bg-app-secondary px-2.5 py-1 text-xs font-semibold text-app-secondary-fg transition hover:bg-app-secondary-hover';
  }

  protected kindLabel(kind: ContactKind): TranslationKey {
    return `contacts.kind.${kind}` as TranslationKey;
  }

  protected genderLabel(gender: Gender | null | undefined): TranslationKey | undefined {
    if (gender === null || gender === undefined) {
      return undefined;
    }

    return `contacts.genderOptions.${gender}` as TranslationKey;
  }

  protected relationshipLabel(id: number | undefined): string | undefined {
    if (id === undefined) {
      return undefined;
    }

    return this.relationshipTypeById().get(id)?.name;
  }

  protected kindIcon(kind: ContactKind): IconName {
    return kind === 'company' ? 'users' : kind === 'pet' ? 'paw' : 'user';
  }

  private nameExists(name: string, excludeId?: number): boolean {
    const normalized = name.toLowerCase();

    return this.contactService
      .contacts()
      .some(
        (contact) => contact.id !== excludeId && contact.name.trim().toLowerCase() === normalized,
      );
  }
}
