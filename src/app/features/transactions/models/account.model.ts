export type AccountType = 'receivable' | 'payable';

export type AccountStatus = 'pending' | 'paid';

export interface Account {
  readonly id?: number;
  readonly type: AccountType;
  readonly categoryId?: number;
  readonly contactId: number;
  readonly concept: string;
  readonly amount: number;
  readonly dueDate?: string;
  readonly status: AccountStatus;
}

export type NewAccount = Omit<Account, 'id'>;
