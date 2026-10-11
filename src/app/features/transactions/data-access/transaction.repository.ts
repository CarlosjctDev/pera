import { InjectionToken } from '@angular/core';

import type {
  NewTransaction,
  Transaction,
} from '@app/features/transactions/models/transaction.model';

export interface TransactionPageSort {
  readonly key: 'date' | 'amount';
  readonly dir: 'asc' | 'desc';
}

export interface TransactionPageQuery {
  readonly offset: number;
  readonly limit: number;
  readonly sort?: TransactionPageSort | null;
  readonly search?: Partial<Record<'detail' | 'contact', string>>;
}

export interface TransactionPageResult {
  readonly rows: readonly Transaction[];
  readonly total: number;
}

export interface TransactionRepository {
  list(): Promise<readonly Transaction[]>;
  add(newTransaction: NewTransaction): Promise<Transaction>;
  bulkAdd(newTransactions: readonly NewTransaction[]): Promise<readonly Transaction[]>;
  findOnDates(dates: readonly Date[]): Promise<readonly Transaction[]>;
  delete(id: number): Promise<void>;
  removeByAccountId(accountId: number): Promise<void>;
  queryPage(query: TransactionPageQuery): Promise<TransactionPageResult>;
}

export const TRANSACTION_REPOSITORY = new InjectionToken<TransactionRepository>(
  'TRANSACTION_REPOSITORY',
);
