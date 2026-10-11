import { InjectionToken } from '@angular/core';

import type {
  NewScheduledMovement,
  ScheduledMovement,
} from '@app/features/transactions/models/scheduled-movement.model';

export interface ScheduledMovementRepository {
  list(): Promise<readonly ScheduledMovement[]>;
  findDue(today: string): Promise<readonly ScheduledMovement[]>;
  add(newItem: NewScheduledMovement): Promise<ScheduledMovement>;
  update(item: ScheduledMovement): Promise<void>;
  remove(id: number): Promise<void>;
}

export const SCHEDULED_MOVEMENT_REPOSITORY = new InjectionToken<ScheduledMovementRepository>(
  'SCHEDULED_MOVEMENT_REPOSITORY',
);
