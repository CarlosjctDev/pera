import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Icon } from '@app/core/components/icons/icon.component';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { T } from '@app/core/i18n/pipes/t.pipe';

import type {
  Recurrence,
  RecurrenceKind,
} from '@app/features/transactions/models/recurrence.model';

@Component({
  selector: 'app-schedule-fields',
  imports: [FormsModule, Icon, T],
  templateUrl: './schedule-fields.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleFields {
  readonly enableLabelKey = input<TranslationKey>('scheduled.enable');
  readonly dateHintKey = input<TranslationKey | null>('scheduled.dateHint');
  readonly dayHintKey = input<TranslationKey>('scheduled.dayHint');
  readonly hintKey = input<TranslationKey | null>('scheduled.hint');

  readonly kindChange = output<RecurrenceKind>();

  readonly enabled = signal(false);
  protected readonly kind = signal<RecurrenceKind>('none');
  protected readonly every = signal(1);
  protected readonly dayOfMonth = signal<number | null>(null);
  protected readonly omitWeekdays = signal<readonly number[]>([]);

  protected readonly kinds: readonly { value: RecurrenceKind; labelKey: TranslationKey }[] = [
    { value: 'none', labelKey: 'accounts.recurrence.none' },
    { value: 'days', labelKey: 'accounts.recurrence.units.days' },
    { value: 'weeks', labelKey: 'accounts.recurrence.units.weeks' },
    { value: 'months', labelKey: 'accounts.recurrence.units.months' },
    { value: 'years', labelKey: 'accounts.recurrence.units.years' },
  ];

  protected readonly weekdays: readonly { value: number; labelKey: TranslationKey }[] = [
    { value: 0, labelKey: 'accounts.recurrence.weekdays.0' },
    { value: 1, labelKey: 'accounts.recurrence.weekdays.1' },
    { value: 2, labelKey: 'accounts.recurrence.weekdays.2' },
    { value: 3, labelKey: 'accounts.recurrence.weekdays.3' },
    { value: 4, labelKey: 'accounts.recurrence.weekdays.4' },
    { value: 5, labelKey: 'accounts.recurrence.weekdays.5' },
    { value: 6, labelKey: 'accounts.recurrence.weekdays.6' },
  ];

  isEnabled(): boolean {
    return this.enabled();
  }

  recurrenceKind(): RecurrenceKind {
    return this.enabled() ? this.kind() : 'none';
  }

  recurrence(): Recurrence | undefined {
    const kind = this.kind();

    if (!this.enabled() || kind === 'none') {
      return undefined;
    }

    const dayOfMonth = this.dayOfMonth();
    const omitWeekdays = this.omitWeekdays();

    return {
      kind,
      every: this.clampEvery(this.every()),
      dayOfMonth: dayOfMonth === null ? null : dayOfMonth,
      month: null,
      omitWeekdays: omitWeekdays.length > 0 ? [...omitWeekdays] : undefined,
    };
  }

  reset(): void {
    this.enabled.set(false);
    this.kind.set('none');
    this.every.set(1);
    this.dayOfMonth.set(null);
    this.omitWeekdays.set([]);
    this.kindChange.emit('none');
  }

  protected onEnabledChange(value: boolean): void {
    this.enabled.set(value);
    this.kindChange.emit(this.recurrenceKind());
  }

  protected selectKind(value: RecurrenceKind): void {
    this.kind.set(value);
    this.kindChange.emit(this.recurrenceKind());
  }

  protected onEveryChange(value: number | null): void {
    this.every.set(this.clampEvery(value));
  }

  protected onDayChange(value: number | null): void {
    this.dayOfMonth.set(this.clampDay(value));
  }

  protected isOmitted(value: number): boolean {
    return this.omitWeekdays().includes(value);
  }

  protected toggleOmit(value: number): void {
    const current = this.omitWeekdays();
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value].sort((a, b) => a - b);

    this.omitWeekdays.set(next);
  }

  protected unitsKey(kind: RecurrenceKind): TranslationKey {
    switch (kind) {
      case 'days':
        return 'accounts.recurrence.units.days';
      case 'weeks':
        return 'accounts.recurrence.units.weeks';
      case 'months':
        return 'accounts.recurrence.units.months';
      case 'years':
        return 'accounts.recurrence.units.years';
      default:
        return 'accounts.recurrence.none';
    }
  }

  private clampEvery(value: number | null): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
  }

  private clampDay(value: number | null): number | null {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.min(31, Math.max(1, Math.floor(value)))
      : null;
  }
}
