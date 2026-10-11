import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

import { buildMonthMatrix, toDayKey } from './calendar.utils';

import type { Account, AccountType } from '@app/features/transactions/models/account.model';
import type { Transaction } from '@app/features/transactions/models/transaction.model';
import type { TransactionType } from '@app/features/transactions/models/transaction-type.model';

import type {
  PeriodGranularity,
  PeriodOption,
  PeriodRange,
  PeriodTotals,
} from '../models/period-comparison.model';

const WEEK_START = 1;

export function toIsoDay(date: Date): string {
  return toDayKey(date);
}

export function resolveRange(granularity: PeriodGranularity, anchor: Date): PeriodRange {
  switch (granularity) {
    case 'day':
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case 'week':
      return {
        start: startOfWeek(anchor, { weekStartsOn: WEEK_START }),
        end: endOfWeek(anchor, { weekStartsOn: WEEK_START }),
      };
    case 'month':
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    default:
      return { start: startOfYear(anchor), end: endOfYear(anchor) };
  }
}

export function startOfPeriod(granularity: PeriodGranularity, date: Date): Date {
  return resolveRange(granularity, date).start;
}

export function addPeriods(granularity: PeriodGranularity, date: Date, amount: number): Date {
  switch (granularity) {
    case 'day':
      return addDays(date, amount);
    case 'week':
      return addWeeks(date, amount);
    case 'month':
      return addMonths(date, amount);
    default:
      return addYears(date, amount);
  }
}

function isWithin(date: Date, ranges: readonly PeriodRange[]): boolean {
  return ranges.some((range) => date >= range.start && date <= range.end);
}

function dayWithin(day: string, ranges: readonly PeriodRange[]): boolean {
  return ranges.some((range) => day >= toIsoDay(range.start) && day <= toIsoDay(range.end));
}

export function summarize(
  transactions: readonly Transaction[],
  accounts: readonly Account[],
  ranges: readonly PeriodRange[],
): PeriodTotals {
  let income = 0;
  let expense = 0;
  let saving = 0;
  let investment = 0;
  let transfer = 0;
  let count = 0;

  for (const transaction of transactions) {
    if (!isWithin(transaction.date, ranges)) {
      continue;
    }

    count += 1;

    switch (transaction.type) {
      case 'income':
        income += transaction.amount;
        break;
      case 'expense':
        expense += transaction.amount;
        break;
      case 'saving':
        saving += transaction.amount;
        break;
      case 'investment':
        investment += transaction.amount;
        break;
      default:
        transfer += transaction.amount;
    }
  }

  let receivable = 0;
  let payable = 0;

  for (const account of accounts) {
    if (account.status !== 'pending' || account.dueDate === undefined) {
      continue;
    }

    if (!dayWithin(account.dueDate, ranges)) {
      continue;
    }

    if (account.type === 'receivable') {
      receivable += account.amount;
    } else {
      payable += account.amount;
    }
  }

  const days = ranges.reduce(
    (sum, range) =>
      sum +
      Math.round(
        (startOfDay(range.end).getTime() - startOfDay(range.start).getTime()) / 86_400_000,
      ) +
      1,
    0,
  );

  return {
    income,
    expense,
    balance: income - expense,
    saving,
    investment,
    transfer,
    receivable,
    payable,
    count,
    days,
    averagePerDay: days > 0 ? expense / days : 0,
    averagePerMovement: count > 0 ? (income + expense) / count : 0,
  };
}

export function diff(current: number, previous: number): { amount: number; percent: number | null } {
  const amount = current - previous;
  const percent =
    previous === 0 ? (current === 0 ? 0 : null) : (amount / Math.abs(previous)) * 100;

  return { amount, percent };
}

export function groupAmountBy(
  transactions: readonly Transaction[],
  ranges: readonly PeriodRange[],
  type: TransactionType,
  selectId: (transaction: Transaction) => number | undefined,
): Map<number, number> {
  const totals = new Map<number, number>();

  for (const transaction of transactions) {
    if (transaction.type !== type || !isWithin(transaction.date, ranges)) {
      continue;
    }

    const id = selectId(transaction);

    if (id === undefined) {
      continue;
    }

    totals.set(id, (totals.get(id) ?? 0) + transaction.amount);
  }

  return totals;
}

export function groupAccountAmountBy(
  accounts: readonly Account[],
  ranges: readonly PeriodRange[],
  type: AccountType,
  selectId: (account: Account) => number | undefined,
): Map<number, number> {
  const totals = new Map<number, number>();

  for (const account of accounts) {
    if (
      account.type !== type ||
      account.status !== 'pending' ||
      account.dueDate === undefined ||
      !dayWithin(account.dueDate, ranges)
    ) {
      continue;
    }

    const id = selectId(account);

    if (id === undefined) {
      continue;
    }

    totals.set(id, (totals.get(id) ?? 0) + account.amount);
  }

  return totals;
}

function format(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function singlePeriodLabel(
  granularity: PeriodGranularity,
  anchor: Date,
  locale: string,
): string {
  switch (granularity) {
    case 'day':
      return format(anchor, locale, { day: 'numeric', month: 'short' });
    case 'week': {
      const end = addDays(anchor, 6);

      return `${format(anchor, locale, { day: 'numeric', month: 'short' })} – ${format(end, locale, { day: 'numeric', month: 'short' })}`;
    }
    case 'month':
      return format(anchor, locale, { month: 'short', year: 'numeric' });
    default:
      return format(anchor, locale, { year: 'numeric' });
  }
}

export function focusLabel(granularity: PeriodGranularity, focus: Date, locale: string): string {
  if (granularity === 'day' || granularity === 'week') {
    return format(focus, locale, { month: 'long', year: 'numeric' });
  }

  if (granularity === 'month') {
    return format(focus, locale, { year: 'numeric' });
  }

  const year = focus.getFullYear();

  return `${year - 4} – ${year + 5}`;
}

export function buildPeriodOptions(
  granularity: PeriodGranularity,
  focus: Date,
  locale: string,
  today: string,
): readonly PeriodOption[] {
  const year = focus.getFullYear();
  const month = focus.getMonth();

  if (granularity === 'week') {
    return buildMonthMatrix(year, month + 1)
      .filter((week) => week.some((day) => day.getMonth() === month))
      .map((week) => {
        const anchor = week[0];
        const end = week[6];

        return {
          key: toIsoDay(anchor),
          anchor,
          label: `${format(anchor, locale, { day: 'numeric', month: 'short' })} – ${format(end, locale, { day: 'numeric', month: 'short' })}`,
          disabled: toIsoDay(anchor) > today,
        };
      });
  }

  if (granularity === 'month') {
    return Array.from({ length: 12 }, (_, index) => {
      const anchor = new Date(year, index, 1);

      return {
        key: toIsoDay(anchor),
        anchor,
        label: format(anchor, locale, { month: 'short' }),
        disabled: toIsoDay(anchor) > today,
      };
    });
  }

  const options: PeriodOption[] = [];

  for (let value = year - 4; value <= year + 5; value += 1) {
    const anchor = new Date(value, 0, 1);

    options.push({
      key: toIsoDay(anchor),
      anchor,
      label: String(value),
      disabled: toIsoDay(anchor) > today,
    });
  }

  return options;
}
