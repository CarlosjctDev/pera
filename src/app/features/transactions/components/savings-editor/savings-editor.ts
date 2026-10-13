import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Icon } from '@app/core/components/icons/icon.component';
import { SelectComponent } from '@app/core/components/select/select.component';
import type { SelectOption } from '@app/core/components/select/select.component';

import { T } from '@app/core/i18n/pipes/t.pipe';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { currencySymbol } from '@app/features/profile/models/currency.model';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { MasterDataDialogsService } from '@app/features/master-data/services/master-data-dialogs.service';
import { CategoryService } from '@app/features/transactions/services/category.service';

import { emptySavingDraft } from '@app/features/transactions/models/saving-draft.model';

import type { SavingDraft } from '@app/features/transactions/models/saving-draft.model';

@Component({
  selector: 'app-savings-editor',
  imports: [FormsModule, Icon, SelectComponent, T, I18nCurrency],
  templateUrl: './savings-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsEditor {
  private readonly profile = inject(ProfileService);
  private readonly categoryService = inject(CategoryService);
  private readonly masterDialogs = inject(MasterDataDialogsService);

  readonly value = model<readonly SavingDraft[]>([]);
  readonly max = input<number | null>(null);

  protected readonly symbol = computed(() => currencySymbol(this.profile.currency()));
  protected readonly currency = this.profile.currency;

  protected readonly submitted = signal(false);

  protected readonly categories = this.categoryService.categories;

  protected readonly categoryOptions = computed<readonly SelectOption[]>(() =>
    this.categories().map((category) => ({ value: category.id ?? null, label: category.name })),
  );

  protected readonly total = computed(() =>
    this.value().reduce((sum, draft) => sum + (draft.amount ?? 0), 0),
  );

  protected readonly remaining = computed(() => (this.max() ?? 0) - this.total());

  protected readonly overLimit = computed(() => {
    const max = this.max();

    return max !== null && Math.round(this.total() * 100) > Math.round(max * 100);
  });

  protected add(): void {
    this.value.set([...this.value(), emptySavingDraft()]);
  }

  protected remove(index: number): void {
    this.value.set(this.value().filter((_, current) => current !== index));
  }

  protected onAmountChange(index: number, value: number | null): void {
    this.update(index, {
      amount: typeof value === 'number' && !Number.isNaN(value) ? value : null,
    });
  }

  protected onCategoryChange(index: number, value: number | null): void {
    this.update(index, { categoryId: typeof value === 'number' ? value : null });
  }

  protected onConceptChange(index: number, value: string): void {
    this.update(index, { concept: value });
  }

  protected async addCategory(index: number): Promise<void> {
    const category = await this.masterDialogs.addCategory();

    if (category?.id !== undefined) {
      this.update(index, { categoryId: category.id });
    }
  }

  protected amountInvalid(draft: SavingDraft): boolean {
    return this.submitted() && (draft.amount === null || draft.amount <= 0);
  }

  protected categoryInvalid(draft: SavingDraft): boolean {
    return this.submitted() && draft.categoryId === null;
  }

  validate(): boolean {
    this.submitted.set(true);

    const rowsValid = this.value().every(
      (draft) => draft.amount !== null && draft.amount > 0 && draft.categoryId !== null,
    );

    return rowsValid && !this.overLimit();
  }

  reset(): void {
    this.value.set([]);
    this.submitted.set(false);
  }

  private update(index: number, patch: Partial<SavingDraft>): void {
    this.value.set(
      this.value().map((draft, current) => (current === index ? { ...draft, ...patch } : draft)),
    );
  }
}
