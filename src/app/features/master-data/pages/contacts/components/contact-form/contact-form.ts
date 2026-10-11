import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Icon } from '@app/core/components/icons/icon.component';
import { SelectComponent } from '@app/core/components/select/select.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { RelationshipTypeService } from '@app/features/master-data/services/relationship-type.service';

import type { ContactKind } from '@app/features/master-data/models/contact-kind.model';
import type { Gender } from '@app/features/master-data/models/contact.model';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';

const GENDERS: readonly Gender[] = ['male', 'female', 'non_binary', 'prefer_not_to_say', 'other'];

@Component({
  selector: 'app-contact-form',
  imports: [FormsModule, Icon, SelectComponent, T],
  templateUrl: './contact-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactForm {
  private readonly contactService = inject(ContactService);
  private readonly relationshipTypeService = inject(RelationshipTypeService);
  private readonly toastr = inject(ToastrService);

  readonly kind = input.required<ContactKind>();

  protected readonly relationshipTypes = this.relationshipTypeService.relationshipTypes;
  protected readonly genders: readonly Gender[] = GENDERS;

  protected readonly relationshipOptions = computed(() =>
    this.relationshipTypes().map((type) => ({ value: type.id ?? null, label: type.name })),
  );

  protected readonly name = signal('');
  protected readonly gender = signal<Gender | null>(null);
  protected readonly relationshipTypeId = signal<number | null>(null);
  protected readonly nameError = signal(false);
  protected readonly nameDuplicate = signal(false);
  protected readonly genderError = signal(false);
  protected readonly saving = signal(false);

  protected readonly isPerson = computed(() => this.kind() === 'person');

  protected selectGender(gender: Gender): void {
    this.gender.set(gender);
    this.genderError.set(false);
  }

  protected onRelationshipChange(value: number | null): void {
    this.relationshipTypeId.set(typeof value === 'number' ? value : null);
  }

  protected genderClass(gender: Gender): string {
    return this.gender() === gender
      ? 'flex items-center justify-center rounded-lg bg-app-primary px-3 py-1.5 text-xs font-semibold text-app-primary-fg transition'
      : 'flex items-center justify-center rounded-lg bg-app-secondary px-3 py-1.5 text-xs font-semibold text-app-secondary-fg transition hover:bg-app-secondary-hover';
  }

  protected genderLabel(gender: Gender): TranslationKey {
    return `contacts.genderOptions.${gender}` as TranslationKey;
  }

  protected async add(): Promise<void> {
    const name = normalizeText(this.name());
    const gender = this.isPerson() ? this.gender() : null;

    this.nameError.set(!name);
    this.genderError.set(this.isPerson() && gender === null);
    this.nameDuplicate.set(false);

    if (this.nameError() || this.genderError() || this.nameExists(name)) {
      this.nameDuplicate.set(this.nameExists(name));
      return;
    }

    this.saving.set(true);

    try {
      await this.contactService.create({
        name,
        isCompany: this.kind() === 'company',
        gender,
        relationshipTypeId: this.relationshipTypeId() ?? undefined,
      });
      this.name.set('');
      this.gender.set(null);
      this.relationshipTypeId.set(null);
      this.toastr.success('toasts.saved');
    } catch {
      this.toastr.error('toasts.saveError');
    } finally {
      this.saving.set(false);
    }
  }

  private nameExists(name: string): boolean {
    const normalized = name.toLowerCase();

    return this.contactService
      .contacts()
      .some((contact) => contact.name.trim().toLowerCase() === normalized);
  }
}
