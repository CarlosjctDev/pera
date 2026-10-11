import { InjectionToken } from '@angular/core';

import type { Category, NewCategory } from '@app/features/transactions/models/category.model';

export interface CategoryRepository {
  list(): Promise<readonly Category[]>;
  add(newCategory: NewCategory): Promise<Category>;
  update(category: Category): Promise<Category>;
  delete(id: number): Promise<void>;
}

export const CATEGORY_REPOSITORY = new InjectionToken<CategoryRepository>('CATEGORY_REPOSITORY');
