import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Icon } from '@app/core/components/icons/icon.component';
import { SelectComponent } from '@app/core/components/select/select.component';
import { ToastrService } from '@app/core/components/toastr/toastr';

import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';
import { currencySymbol } from '@app/features/profile/models/currency.model';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { MasterDataDialogsService } from '@app/features/master-data/services/master-data-dialogs.service';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { ScheduleFields } from '@app/features/transactions/components/schedule-fields/schedule-fields';
import { ScheduledMovementService } from '@app/features/transactions/services/scheduled-movement.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';
import { AttachmentPicker } from '@app/features/attachments/components/attachment-picker/attachment-picker';
import { AttachmentService } from '@app/features/attachments/services/attachment.service';

import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import type { ContactKind } from '@app/features/master-data/models/contact-kind.model';

@Component({
  selector: 'app-income-form',
  imports: [FormsModule, Icon, SelectComponent, T, ScheduleFields, AttachmentPicker],
  templateUrl: './income-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomeForm {
  private readonly profile = inject(ProfileService);
  private readonly contactService = inject(ContactService);
  private readonly masterDialogs = inject(MasterDataDialogsService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly scheduledMovementService = inject(ScheduledMovementService);
  private readonly attachmentService = inject(AttachmentService);
  private readonly toastr = inject(ToastrService);

  private readonly scheduleFields = viewChild.required(ScheduleFields);
  private readonly attachments = viewChild.required(AttachmentPicker);

  protected readonly currency = this.profile.currency;
  protected readonly symbol = computed(() => currencySymbol(this.currency()));
  protected readonly contacts = this.contactService.contacts;

  protected readonly categories = this.categoryService.categories;

  protected readonly categoryOptions = computed(() =>
    this.categories().map((category) => ({ value: category.id ?? null, label: category.name })),
  );

  protected readonly contactOptions = computed(() => {
    const kind = this.contactKind();

    if (kind === null) {
      return [];
    }

    return this.contacts()
      .filter((contact) => contact.kind === kind)
      .map((contact) => ({ value: contact.id ?? null, label: contact.name }));
  });

  protected readonly showContactPicker = true;

  protected readonly amount = signal<number | null>(null);
  protected readonly categoryId = signal<number | null>(null);
  protected readonly contactId = signal<number | null>(null);
  protected readonly contactKind = signal<ContactKind | null>(null);
  protected readonly concept = signal('');
  protected readonly date = signal(this.todayString());
  protected readonly amountError = signal(false);
  protected readonly categoryError = signal(false);
  protected readonly contactError = signal(false);
  protected readonly saving = signal(false);

  protected onAmountChange(value: number | null): void {
    this.amount.set(typeof value === 'number' && !Number.isNaN(value) ? value : null);
    this.amountError.set(false);
  }

  protected onCategoryChange(value: number | null): void {
    this.categoryId.set(typeof value === 'number' ? value : null);
    this.categoryError.set(false);
  }

  protected onContactChange(value: number | null): void {
    this.contactId.set(typeof value === 'number' ? value : null);
    this.contactError.set(false);
  }

  protected setContactKind(kind: ContactKind): void {
    if (this.contactKind() === kind) {
      return;
    }

    this.contactKind.set(kind);
    this.contactId.set(null);
    this.contactError.set(false);
  }

  protected contactKindClass(kind: ContactKind): string {
    return this.contactKind() === kind
      ? 'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-app-primary px-3 py-2 text-sm font-semibold text-app-primary-fg transition'
      : 'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-app-secondary px-3 py-2 text-sm font-semibold text-app-secondary-fg transition hover:bg-app-secondary-hover';
  }

  protected contactSubmitLabel(): TranslationKey {
    const kind = this.contactKind();

    return kind === null ? ('' as TranslationKey) : (`contacts.submit.${kind}` as TranslationKey);
  }

  protected async addCategory(): Promise<void> {
    const category = await this.masterDialogs.addCategory();

    if (category?.id !== undefined) {
      this.categoryId.set(category.id);
      this.categoryError.set(false);
    }
  }

  protected async addContact(): Promise<void> {
    const kind = this.contactKind();

    if (kind === null) {
      return;
    }

    const contact = await this.masterDialogs.addContact(kind);

    if (contact?.id !== undefined) {
      this.contactId.set(contact.id);
      this.contactError.set(false);
    }
  }

  protected async submit(): Promise<void> {
    const amount = this.amount();
    const categoryId = this.categoryId();
    const contactId = this.contactId();

    this.amountError.set(amount === null || amount <= 0);
    this.categoryError.set(categoryId === null);
    this.contactError.set(contactId === null);

    if (this.amountError() || this.categoryError() || this.contactError()) {
      return;
    }

    this.saving.set(true);

    const schedule = this.scheduleFields();
    const scheduled = schedule.isEnabled();
    const concept = normalizeText(this.concept());
    const rounded = Math.round((amount as number) * 100) / 100;

    try {
      if (scheduled) {
        await this.scheduledMovementService.schedule({
          type: 'income',
          categoryId: categoryId as number,
          contactId: this.contactId() ?? undefined,
          concept,
          amount: rounded,
          startDate: this.date(),
          recurrence: schedule.recurrence(),
          nextDate: this.date(),
          active: true,
        });
      } else {
        const transaction = await this.transactionService.add({
          type: 'income',
          categoryId: categoryId as number,
          contactId: this.contactId() ?? undefined,
          date: new Date(`${this.date()}T00:00:00`),
          concept,
          amount: rounded,
        });

        await this.saveAttachments(transaction.id as number);
      }

      this.attachments().clear();
      this.amount.set(null);
      this.categoryId.set(null);
      this.contactId.set(null);
      this.contactKind.set(null);
      this.concept.set('');
      this.date.set(this.todayString());
      schedule.reset();
      this.toastr.success(scheduled ? 'toasts.scheduledSaved' : 'toasts.saved');
    } catch {
      this.toastr.error('toasts.saveError');
    } finally {
      this.saving.set(false);
    }
  }

  private todayString(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 10);
  }

  private async saveAttachments(ownerId: number): Promise<void> {
    const pending = this.attachments().pending();

    if (pending.length === 0) {
      return;
    }

    await this.attachmentService.addMany(
      pending.map((file) => ({ ...file, ownerType: 'transaction', ownerId })),
    );
  }
}
