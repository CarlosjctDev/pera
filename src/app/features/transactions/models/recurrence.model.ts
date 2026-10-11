export type RecurrenceKind = 'none' | 'days' | 'weeks' | 'months' | 'years';

export interface Recurrence {
  readonly kind: RecurrenceKind;
  readonly every?: number | null;
  readonly dayOfMonth?: number | null;
  readonly month?: number | null;
  readonly omitWeekdays?: readonly number[];
}
