import type { TranslationKey, TranslationParams } from '@app/core/i18n/i18n.keys';

import type { Recurrence, RecurrenceKind } from '../models/recurrence.model';

const MAX_ITERATIONS = 1000;

export interface RecurrenceLabel {
  readonly key: TranslationKey;
  readonly params?: TranslationParams;
  readonly omitWeekdays?: readonly number[];
}

function isOmittedWeekday(recurrence: Recurrence, date: Date): boolean {
  const omitWeekdays = recurrence.omitWeekdays;

  return Array.isArray(omitWeekdays) && omitWeekdays.includes(date.getDay());
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function stepDate(
  kind: RecurrenceKind,
  every: number,
  start: Date,
  dayOfMonth: number,
  month: number,
  k: number,
): Date {
  switch (kind) {
    case 'days':
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + k * every);
    case 'weeks':
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + k * every * 7);
    case 'months': {
      const monthIndex = start.getMonth() + k * every;
      const year = start.getFullYear() + Math.floor(monthIndex / 12);
      const monthBase = monthIndex % 12;

      const candidate = new Date(year, monthBase, 1);

      candidate.setDate(Math.min(dayOfMonth, daysInMonth(year, monthBase)));
      return candidate;
    }
    case 'years': {
      const year = start.getFullYear() + k * every;

      const candidate = new Date(year, month, 1);

      candidate.setDate(Math.min(dayOfMonth, daysInMonth(year, month)));
      return candidate;
    }
    default:
      return start;
  }
}

function occurrenceParametrize(
  recurrence: Recurrence,
  anchor: Date,
): { start: Date; dayOfMonth: number; month: number; every: number } {
  return {
    start: anchor,
    dayOfMonth: recurrence.dayOfMonth ?? anchor.getDate(),
    month: recurrence.month ?? anchor.getMonth(),
    every: Math.max(1, recurrence.every ?? 1),
  };
}

export function nextDueIso(
  recurrence: Recurrence | undefined,
  anchor: string | undefined,
  from: Date = new Date(),
): string | undefined {
  if (!recurrence || recurrence.kind === 'none') {
    return undefined;
  }

  const { start, dayOfMonth, month, every } = occurrenceParametrize(
    recurrence,
    anchor ? parseIsoDate(anchor) : startOfDay(from),
  );
  const fromStart = startOfDay(from).getTime();

  for (let k = 1; k <= MAX_ITERATIONS; k += 1) {
    const candidate = stepDate(recurrence.kind, every, start, dayOfMonth, month, k);

    if (isOmittedWeekday(recurrence, candidate)) {
      continue;
    }

    if (candidate.getTime() > fromStart) {
      return toIsoDate(candidate);
    }
  }

  return undefined;
}

export function occurrencesFrom(
  recurrence: Recurrence,
  anchor: string | undefined,
  upTo: Date,
): readonly string[] {
  if (recurrence.kind === 'none') {
    return [];
  }

  const { start, dayOfMonth, month, every } = occurrenceParametrize(
    recurrence,
    anchor ? parseIsoDate(anchor) : startOfDay(upTo),
  );
  const limit = startOfDay(upTo).getTime();

  const result: string[] = [];

  for (let k = 1; k <= MAX_ITERATIONS; k += 1) {
    const candidate = stepDate(recurrence.kind, every, start, dayOfMonth, month, k);

    if (isOmittedWeekday(recurrence, candidate)) {
      continue;
    }

    if (candidate.getTime() <= limit) {
      result.push(toIsoDate(candidate));
    } else {
      if (result.length === 0) {
        result.push(toIsoDate(candidate));
      }
      break;
    }
  }

  return result;
}

export function recurrenceLabel(recurrence: Recurrence | undefined): RecurrenceLabel | null {
  if (!recurrence || recurrence.kind === 'none') {
    return null;
  }

  const every = Math.max(1, recurrence.every ?? 1);

  switch (recurrence.kind) {
    case 'days':
      return every === 1
        ? { key: 'accounts.recurrence.daily' }
        : { key: 'accounts.recurrence.everyDays', params: { every } };
    case 'weeks':
      return every === 1
        ? { key: 'accounts.recurrence.weekly' }
        : { key: 'accounts.recurrence.everyWeeks', params: { every } };
    case 'months': {
      const day = recurrence.dayOfMonth;

      if (typeof day === 'number' && day > 0) {
        return every === 1
          ? { key: 'accounts.recurrence.monthlyDay', params: { day } }
          : { key: 'accounts.recurrence.everyMonthsDay', params: { every, day } };
      }

      return every === 1
        ? { key: 'accounts.recurrence.monthly' }
        : { key: 'accounts.recurrence.everyMonths', params: { every } };
    }
    case 'years':
      return every === 1
        ? { key: 'accounts.recurrence.yearly' }
        : { key: 'accounts.recurrence.everyYears', params: { every } };
    default:
      return null;
  }
}
