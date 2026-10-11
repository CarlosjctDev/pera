import { InjectionToken } from '@angular/core';

import type {
  Account,
  NewAccount,
  AccountType,
} from '@app/features/transactions/models/account.model';

export interface AccountPageSort {
  readonly key: 'amount' | 'dueDate';
  readonly dir: 'asc' | 'desc';
}

export interface AccountPageQuery {
  readonly type: AccountType;
  readonly offset: number;
  readonly limit: number;
  readonly sort?: AccountPageSort | null;
  readonly search?: Partial<Record<'contact' | 'concept', string>>;
}

export interface AccountPageResult {
  readonly rows: readonly Account[];
  readonly total: number;
  readonly pendingTotal: number;
}

export interface AccountRepository {
  list(): Promise<readonly Account[]>;
  add(newAccount: NewAccount): Promise<Account>;
  bulkAdd(newAccounts: readonly NewAccount[]): Promise<readonly Account[]>;
  update(account: Account): Promise<Account>;
  delete(id: number): Promise<void>;
  queryPage(query: AccountPageQuery): Promise<AccountPageResult>;
}

export const ACCOUNT_REPOSITORY = new InjectionToken<AccountRepository>('ACCOUNT_REPOSITORY');
