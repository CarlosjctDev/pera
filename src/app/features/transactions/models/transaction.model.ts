import type { TransactionType } from './transaction-type.model';

export interface Transaction {
  readonly id?: number;
  readonly type: TransactionType;
  readonly categoryId: number;
  readonly contactId?: number;
  readonly date: Date;
  readonly concept: string;
  readonly amount: number;
  readonly scheduledId?: number;
  readonly accountId?: number;
  readonly incomeId?: number;
}

export type NewTransaction = Omit<Transaction, 'id'>;
