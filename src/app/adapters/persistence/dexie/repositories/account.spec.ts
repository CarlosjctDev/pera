import { compareAccountStatus } from './account';

import type { Account } from '@app/features/transactions/models/account.model';

const account = (status: Account['status']): Account => ({
  type: 'receivable',
  contactId: 1,
  concept: 'Invoice',
  amount: 100,
  status,
});

describe('compareAccountStatus', () => {
  it('places pending accounts before paid accounts', () => {
    expect(compareAccountStatus(account('pending'), account('paid'))).toBeLessThan(0);
    expect(compareAccountStatus(account('paid'), account('pending'))).toBeGreaterThan(0);
  });

  it('keeps accounts with the same status together for secondary sorting', () => {
    expect(compareAccountStatus(account('pending'), account('pending'))).toBe(0);
    expect(compareAccountStatus(account('paid'), account('paid'))).toBe(0);
  });
});