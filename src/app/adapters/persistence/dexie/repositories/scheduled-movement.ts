import { Injectable, inject } from '@angular/core';

import type {
  ScheduledMovementRepository,
} from '@app/features/transactions/data-access/scheduled-movement.repository';
import type {
  NewScheduledMovement,
  ScheduledMovement,
} from '@app/features/transactions/models/scheduled-movement.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';

@Injectable()
export class DexieScheduledMovementRepository implements ScheduledMovementRepository {
  private readonly db = inject(AppDatabase);

  async list(): Promise<readonly ScheduledMovement[]> {
    return this.db.scheduledMovements.orderBy('nextDate').toArray();
  }

  async findDue(today: string): Promise<readonly ScheduledMovement[]> {
    return this.db.scheduledMovements
      .where('nextDate')
      .belowOrEqual(today)
      .and((item) => item.active)
      .toArray();
  }

  async add(newItem: NewScheduledMovement): Promise<ScheduledMovement> {
    const id = await this.db.scheduledMovements.add(newItem);

    return { ...newItem, id };
  }

  async update(item: ScheduledMovement): Promise<void> {
    await this.db.scheduledMovements.put(item);
  }

  async remove(id: number): Promise<void> {
    await this.db.scheduledMovements.delete(id);
  }
}
