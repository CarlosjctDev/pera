export type TransactionType = 'income' | 'expense' | 'saving';

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  income: 'text-emerald-600 dark:text-emerald-400',
  expense: 'text-red-600 dark:text-red-400',
  saving: 'text-amber-600 dark:text-amber-400',
};