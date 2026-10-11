import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';

export type PeriodGranularity = 'day' | 'week' | 'month' | 'year';

export const PERIOD_GRANULARITIES: readonly PeriodGranularity[] = [
  'day',
  'week',
  'month',
  'year',
];

export type ComparisonTarget = 'a' | 'b';

export type TopKind = TransactionType | 'receivable' | 'payable';

export interface PeriodRange {
  readonly start: Date;
  readonly end: Date;
}

export interface PeriodTotals {
  readonly income: number;
  readonly expense: number;
  readonly balance: number;
  readonly saving: number;
  readonly investment: number;
  readonly transfer: number;
  readonly receivable: number;
  readonly payable: number;
  readonly count: number;
  readonly days: number;
  readonly averagePerDay: number;
  readonly averagePerMovement: number;
}

export interface PeriodDiff {
  readonly amount: number;
  readonly percent: number | null;
}

export interface RankedItem {
  readonly id: number;
  readonly label: string;
  readonly amount: number;
}

export interface PeriodOption {
  readonly key: string;
  readonly anchor: Date;
  readonly label: string;
  readonly disabled: boolean;
}

export interface ComparisonMetric {
  readonly key: TransactionType | 'balance' | 'count';
  readonly color: string;
}
