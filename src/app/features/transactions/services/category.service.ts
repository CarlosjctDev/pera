import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { CATEGORY_REPOSITORY } from '@app/features/transactions/data-access/category.repository';

import type { Category, NewCategory } from '@app/features/transactions/models/category.model';

const UNCATEGORIZED_NAME = 'Sin categoría';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly repository = inject(CATEGORY_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _categories = signal<readonly Category[]>([]);
  private readonly _loading = signal(true);

  readonly categories = this._categories.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.reload());
  }

  async load(): Promise<void> {
    await this.reload();
    this._loading.set(false);
  }

  private async reload(): Promise<void> {
    try {
      this._categories.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }

  async ensureDefaultCategory(): Promise<number> {
    const all = await this.repository.list();

    const existing = all.find((category) => category.name === UNCATEGORIZED_NAME);

    if (existing?.id !== undefined) {
      return existing.id;
    }

    const category = await this.repository.add({ name: UNCATEGORIZED_NAME });

    this._categories.set(await this.repository.list());

    return category.id as number;
  }

  async create(newCategory: NewCategory): Promise<Category> {
    const category = await this.repository.add(newCategory);
    this._categories.set([...this._categories(), category]);
    return category;
  }

  async update(category: Category): Promise<void> {
    await this.repository.update(category);
    this._categories.set(
      this._categories().map((current) => (current.id === category.id ? category : current)),
    );
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
    this._categories.set(this._categories().filter((category) => category.id !== id));
  }
}
