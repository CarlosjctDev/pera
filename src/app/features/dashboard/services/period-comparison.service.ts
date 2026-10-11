import { Injectable, computed, signal } from '@angular/core';
import { addMonths, addYears } from 'date-fns';

import { resolveRange, startOfPeriod, toIsoDay } from '../utils/period.utils';

import type { PeriodGranularity, PeriodRange } from '../models/period-comparison.model';

export type ComparisonTarget = 'a' | 'b';

@Injectable()
export class PeriodComparisonService {
  private readonly today = new Date();

  readonly granularity = signal<PeriodGranularity>('month');

  private readonly selectionA = signal<readonly Date[]>([startOfPeriod('month', new Date())]);
  private readonly selectionB = signal<readonly Date[]>([startOfPeriod('month', new Date())]);
  private readonly focusA = signal<Date>(new Date());
  private readonly focusB = signal<Date>(new Date());

  readonly selectedA = this.selectionA.asReadonly();
  readonly selectedB = this.selectionB.asReadonly();

  readonly rangesA = computed<readonly PeriodRange[]>(() =>
    this.selectionA().map((anchor) => resolveRange(this.granularity(), anchor)),
  );
  readonly rangesB = computed<readonly PeriodRange[]>(() =>
    this.selectionB().map((anchor) => resolveRange(this.granularity(), anchor)),
  );

  setGranularity(granularity: PeriodGranularity): void {
    if (granularity === this.granularity()) {
      return;
    }

    const refA = this.selectionA()[0] ?? this.focusA();
    const refB = this.selectionB()[0] ?? this.focusB();

    this.granularity.set(granularity);

    const a = startOfPeriod(granularity, refA);
    const b = startOfPeriod(granularity, refB);

    this.selectionA.set([a]);
    this.selectionB.set([b]);
    this.focusA.set(a);
    this.focusB.set(b);
  }

  focus(target: ComparisonTarget): Date {
    return target === 'a' ? this.focusA() : this.focusB();
  }

  toggle(target: ComparisonTarget, anchor: Date): void {
    const period = startOfPeriod(this.granularity(), anchor);

    if (this.isFuture(period)) {
      return;
    }

    const current = this.selection(target)();
    const key = toIsoDay(period);
    const exists = current.some((item) => toIsoDay(item) === key);

    if (exists) {
      const next = current.filter((item) => toIsoDay(item) !== key);

      if (next.length === 0) {
        return;
      }

      this.selection(target).set(next);

      return;
    }

    const next = [...current, period].sort((first, second) => first.getTime() - second.getTime());
    this.selection(target).set(next);
  }

  isSelected(target: ComparisonTarget, anchor: Date): boolean {
    const key = toIsoDay(startOfPeriod(this.granularity(), anchor));

    return this.selection(target)().some((item) => toIsoDay(item) === key);
  }

  setSelection(target: ComparisonTarget, anchors: readonly Date[]): void {
    const granularity = this.granularity();
    const byKey = new Map<string, Date>();

    for (const anchor of anchors) {
      const period = startOfPeriod(granularity, anchor);

      if (this.isFuture(period)) {
        continue;
      }

      byKey.set(toIsoDay(period), period);
    }

    if (byKey.size === 0) {
      return;
    }

    const next = [...byKey.values()].sort((first, second) => first.getTime() - second.getTime());

    this.selection(target).set(next);
  }

  shiftFocus(target: ComparisonTarget, direction: 1 | -1): void {
    const granularity = this.granularity();
    const next = this.nextFocus(this.focus(target), granularity, direction);

    if (toIsoDay(startOfPeriod(granularity, next)) > toIsoDay(this.todayPeriod(granularity))) {
      return;
    }

    this.focusSignal(target).set(next);
  }

  canShiftFocusNext(target: ComparisonTarget): boolean {
    const granularity = this.granularity();
    const next = this.nextFocus(this.focus(target), granularity, 1);

    return toIsoDay(startOfPeriod(granularity, next)) <= toIsoDay(this.todayPeriod(granularity));
  }

  goToday(target: ComparisonTarget): void {
    this.selection(target).set([this.todayPeriod(this.granularity())]);
    this.focusSignal(target).set(new Date());
  }

  private nextFocus(focus: Date, granularity: PeriodGranularity, direction: 1 | -1): Date {
    if (granularity === 'day' || granularity === 'week') {
      return addMonths(focus, direction);
    }

    if (granularity === 'month') {
      return addYears(focus, direction);
    }

    return addYears(focus, direction * 10);
  }

  private isFuture(period: Date): boolean {
    const granularity = this.granularity();

    return toIsoDay(startOfPeriod(granularity, period)) > toIsoDay(this.todayPeriod(granularity));
  }

  private todayPeriod(granularity: PeriodGranularity): Date {
    return startOfPeriod(granularity, this.today);
  }

  private selection(target: ComparisonTarget) {
    return target === 'a' ? this.selectionA : this.selectionB;
  }

  private focusSignal(target: ComparisonTarget) {
    return target === 'a' ? this.focusA : this.focusB;
  }
}
