import { Injectable, inject } from '@angular/core';

import type { CategoryRepository } from '@app/features/transactions/data-access/category.repository';

import type { Category, NewCategory } from '@app/features/transactions/models/category.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';

@Injectable()
export class DexieCategoryRepository implements CategoryRepository {
  private readonly db = inject(AppDatabase);

  async list(): Promise<readonly Category[]> {
    return this.db.categories.reverse().toArray();
  }

  async add(newCategory: NewCategory): Promise<Category> {
    const id = await this.db.categories.add(newCategory);

    return { ...newCategory, id };
  }

  async update(category: Category): Promise<Category> {
    await this.db.categories.put(category);

    return category;
  }

  async delete(id: number): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.categories,
      this.db.transactions,
      this.db.attachments,
      async () => {
        const transactionIds = (await this.db.transactions
          .where('categoryId')
          .equals(id)
          .keys()) as readonly number[];

        if (transactionIds.length > 0) {
          const idSet = new Set(transactionIds);
          await this.db.attachments
            .filter(
              (attachment) =>
                attachment.ownerType === 'transaction' && idSet.has(attachment.ownerId),
            )
            .delete();
          await this.db.transactions.bulkDelete([...transactionIds]);
        }

        await this.db.categories.delete(id);
      },
    );
  }
}
