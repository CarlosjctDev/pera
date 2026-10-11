import type { AccountType } from './account.model';
import type { Recurrence } from './recurrence.model';
import type { TransactionType } from './transaction-type.model';

export interface ScheduledMovement {
  readonly id?: number;
  readonly type: TransactionType;
  readonly accountType?: AccountType;
  readonly categoryId: number;
  readonly contactId?: number;
  readonly concept: string;
  readonly amount: number;
  readonly startDate: string;
  readonly recurrence?: Recurrence;
  readonly nextDate: string;
  readonly active: boolean;
}

export type NewScheduledMovement = Omit<ScheduledMovement, 'id'>;
