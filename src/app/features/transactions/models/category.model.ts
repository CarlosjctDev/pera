import type { TransactionType } from './transaction-type.model';

export interface Category {
  readonly id?: number;
  readonly name: string;
  readonly type?: TransactionType;
}

export type NewCategory = Omit<Category, 'id'>;
