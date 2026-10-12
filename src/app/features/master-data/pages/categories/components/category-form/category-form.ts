import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Icon } from '@app/core/components/icons/icon.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';
import { CategoryService } from '@app/features/transactions/services/category.service';

import type { Category } from '@app/features/transactions/models/category.model';

@Component({
  selector: 'app-category-form',
  imports: [FormsModule, Icon, T],
  templateUrl: './category-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryForm {
  private readonly categoryService = inject(CategoryService);
  private readonly toastr = inject(ToastrService);

  readonly saved = output<Category>();

  protected readonly categoryName = signal('');
  protected readonly categoryNameError = signal(false);
  protected readonly categoryNameDuplicate = signal(false);
  protected readonly saving = signal(false);

  protected async add(): Promise<void> {
    const name = normalizeText(this.categoryName());

    this.categoryNameError.set(!name);
    this.categoryNameDuplicate.set(false);

    if (this.categoryNameError() || this.categoryNameExists(name)) {
      this.categoryNameDuplicate.set(this.categoryNameExists(name));
      return;
    }

    this.saving.set(true);

    try {
      const category = await this.categoryService.create({ name });
      this.categoryName.set('');
      this.saved.emit(category);
      this.toastr.success('toasts.saved');
    } catch {
      this.toastr.error('toasts.saveError');
    } finally {
      this.saving.set(false);
    }
  }

  private categoryNameExists(name: string): boolean {
    const normalized = name.toLowerCase();

    return this.categoryService
      .categories()
      .some((category) => category.name.trim().toLowerCase() === normalized);
  }
}
