import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Icon } from '@app/core/components/icons/icon.component';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { I18nService } from '@app/core/i18n/i18n.service';
import { I18nCurrency } from '@app/core/i18n/pipes/currency.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { AccountService } from '@app/features/transactions/services/account.service';
import { CategoryService } from '@app/features/transactions/services/category.service';
import { TransactionService } from '@app/features/transactions/services/transaction.service';
import { TRANSACTION_TYPE_COLORS } from '@app/features/transactions/models/transaction-type.model';

import { PeriodComparisonService } from '../../services/period-comparison.service';
import {
  buildPeriodOptions,
  diff,
  focusLabel as formatFocusLabel,
  groupAccountAmountBy,
  groupAmountBy,
  singlePeriodLabel,
  summarize,
  toIsoDay,
} from '../../utils/period.utils';
import { buildMonthMatrix } from '../../utils/calendar.utils';

import type { ComparisonTarget } from '../../services/period-comparison.service';
import type {
  PeriodGranularity,
  PeriodOption,
  PeriodRange,
  RankedItem,
  TopKind,
} from '../../models/period-comparison.model';

type MetricKey =
  | 'income'
  | 'expense'
  | 'balance'
  | 'saving'
  | 'investment'
  | 'transfer'
  | 'receivable'
  | 'payable';

interface MetricDef {
  readonly key: MetricKey;
  readonly labelKey: TranslationKey;
  readonly color: string;
  readonly bar: string;
}

interface MetricRow {
  readonly key: MetricKey;
  readonly labelKey: TranslationKey;
  readonly a: number;
  readonly b: number;
  readonly delta: number;
  readonly percent: number | null;
  readonly valueClassA: string;
  readonly valueClassB: string;
  readonly barClassA: string;
  readonly barClassB: string;
  readonly barA: number;
  readonly barB: number;
}

interface AverageRow {
  readonly labelKey: TranslationKey;
  readonly a: number;
  readonly b: number;
  readonly isCount: boolean;
}

interface PanelDay {
  readonly key: string;
  readonly date: Date;
  readonly label: string;
  readonly inMonth: boolean;
  readonly disabled: boolean;
}

interface DragState {
  readonly target: ComparisonTarget;
  readonly mode: 'add' | 'remove';
  readonly snapshot: readonly Date[];
  readonly order: readonly string[];
  readonly datesByKey: ReadonlyMap<string, Date>;
  readonly startIndex: number;
  lastIndex: number;
  readonly startX: number;
  readonly startY: number;
  moved: boolean;
}

interface CellRef {
  readonly key: string;
  readonly date: Date;
}

const POSITIVE = 'text-emerald-600 dark:text-emerald-400';
const NEGATIVE = 'text-red-600 dark:text-red-400';
const POSITIVE_BAR = 'bg-emerald-500';
const NEGATIVE_BAR = 'bg-red-500';

const METRIC_DEFS: readonly MetricDef[] = [
  {
    key: 'income',
    labelKey: 'movements.type.income',
    color: TRANSACTION_TYPE_COLORS.income,
    bar: 'bg-emerald-500',
  },
  {
    key: 'expense',
    labelKey: 'movements.type.expense',
    color: TRANSACTION_TYPE_COLORS.expense,
    bar: 'bg-red-500',
  },
  { key: 'balance', labelKey: 'dashboard.comparison.metrics.balance', color: '', bar: '' },
  {
    key: 'saving',
    labelKey: 'movements.type.saving',
    color: TRANSACTION_TYPE_COLORS.saving,
    bar: 'bg-amber-500',
  },
  {
    key: 'investment',
    labelKey: 'movements.type.investment',
    color: TRANSACTION_TYPE_COLORS.investment,
    bar: 'bg-sky-500',
  },
  {
    key: 'transfer',
    labelKey: 'movements.type.transfer',
    color: TRANSACTION_TYPE_COLORS.transfer,
    bar: 'bg-violet-500',
  },
  {
    key: 'receivable',
    labelKey: 'accounts.receivableTitle',
    color: 'text-teal-600 dark:text-teal-400',
    bar: 'bg-teal-500',
  },
  {
    key: 'payable',
    labelKey: 'accounts.payableTitle',
    color: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
];

function signColor(value: number): { text: string; bar: string } {
  return value >= 0
    ? { text: POSITIVE, bar: POSITIVE_BAR }
    : { text: NEGATIVE, bar: NEGATIVE_BAR };
}

@Component({
  selector: 'app-period-comparison',
  imports: [Icon, T, I18nCurrency],
  templateUrl: './period-comparison.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodComparison implements OnInit, OnDestroy {
  protected readonly comparison = inject(PeriodComparisonService);
  protected readonly profile = inject(ProfileService);

  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly contactService = inject(ContactService);
  private readonly i18n = inject(I18nService);

  private drag: DragState | null = null;
  private suppressClickUntil = 0;

  protected readonly granularities: readonly PeriodGranularity[] = [
    'day',
    'week',
    'month',
    'year',
  ];
  protected readonly targets: readonly ComparisonTarget[] = ['a', 'b'];
  protected readonly weekdays: readonly number[] = [0, 1, 2, 3, 4, 5, 6];
  protected readonly topKinds: readonly TopKind[] = [
    'income',
    'expense',
    'saving',
    'investment',
    'transfer',
    'receivable',
    'payable',
  ];

  protected readonly categoryType = signal<TopKind>('expense');
  protected readonly relationType = signal<TopKind>('expense');

  private readonly totalsA = computed(() =>
    summarize(
      this.transactionService.transactions(),
      this.accountService.accounts(),
      this.comparison.rangesA(),
    ),
  );
  private readonly totalsB = computed(() =>
    summarize(
      this.transactionService.transactions(),
      this.accountService.accounts(),
      this.comparison.rangesB(),
    ),
  );

  protected readonly rows = computed<readonly MetricRow[]>(() => {
    const a = this.totalsA();
    const b = this.totalsB();
    const max = Math.max(
      1,
      ...METRIC_DEFS.flatMap((def) => [Math.abs(a[def.key]), Math.abs(b[def.key])]),
    );

    return METRIC_DEFS.map((def) => {
      const av = a[def.key];
      const bv = b[def.key];
      const result = diff(av, bv);
      const colorA = def.key === 'balance' ? signColor(av) : { text: def.color, bar: def.bar };
      const colorB = def.key === 'balance' ? signColor(bv) : { text: def.color, bar: def.bar };

      return {
        key: def.key,
        labelKey: def.labelKey,
        a: av,
        b: bv,
        delta: result.amount,
        percent: result.percent,
        valueClassA: colorA.text,
        valueClassB: colorB.text,
        barClassA: colorA.bar,
        barClassB: colorB.bar,
        barA: Math.round((Math.abs(av) / max) * 100),
        barB: Math.round((Math.abs(bv) / max) * 100),
      };
    });
  });

  protected readonly averages = computed<readonly AverageRow[]>(() => {
    const a = this.totalsA();
    const b = this.totalsB();

    return [
      { labelKey: 'dashboard.comparison.metrics.count', a: a.count, b: b.count, isCount: true },
      {
        labelKey: 'dashboard.comparison.metrics.avgPerDay',
        a: a.averagePerDay,
        b: b.averagePerDay,
        isCount: false,
      },
      {
        labelKey: 'dashboard.comparison.metrics.avgPerMovement',
        a: a.averagePerMovement,
        b: b.averagePerMovement,
        isCount: false,
      },
    ];
  });

  private readonly categoryNames = computed(() => {
    const map = new Map<number, string>();

    for (const category of this.categoryService.categories()) {
      if (category.id !== undefined) {
        map.set(category.id, category.name);
      }
    }

    return map;
  });

  private readonly contactNames = computed(() => {
    const map = new Map<number, string>();

    for (const contact of this.contactService.contacts()) {
      if (contact.id !== undefined) {
        map.set(contact.id, contact.name);
      }
    }

    return map;
  });

  protected readonly topCategoriesA = computed(() =>
    this.ranked(this.categoryTotals(this.comparison.rangesA(), this.categoryType()), this.categoryNames()),
  );
  protected readonly topCategoriesB = computed(() =>
    this.ranked(this.categoryTotals(this.comparison.rangesB(), this.categoryType()), this.categoryNames()),
  );

  protected readonly topContactsA = computed(() =>
    this.ranked(
      this.contactTotals(this.comparison.rangesA(), this.relationType()),
      this.contactNames(),
    ),
  );
  protected readonly topContactsB = computed(() =>
    this.ranked(
      this.contactTotals(this.comparison.rangesB(), this.relationType()),
      this.contactNames(),
    ),
  );

  ngOnInit(): void {
    void this.transactionService.load();
    void this.accountService.load();
    void this.categoryService.load();
    void this.contactService.load();
  }

  ngOnDestroy(): void {
    this.onPointerUp();
  }

  protected setCategoryType(type: TopKind): void {
    this.categoryType.set(type);
  }

  protected setRelationType(type: TopKind): void {
    this.relationType.set(type);
  }

  protected topKindLabel(kind: TopKind): string {
    if (kind === 'receivable') {
      return this.i18n.t('accounts.receivableTitle');
    }

    if (kind === 'payable') {
      return this.i18n.t('accounts.payableTitle');
    }

    return this.i18n.t(`movements.type.${kind}` as TranslationKey);
  }

  protected periodLabel(target: ComparisonTarget): string {
    return this.i18n.t(
      target === 'a' ? 'dashboard.comparison.periodA' : 'dashboard.comparison.periodB',
    );
  }

  protected selectedCount(target: ComparisonTarget): number {
    return this.selected(target).length;
  }

  protected selectedSummary(target: ComparisonTarget): string {
    const granularity = this.comparison.granularity();

    return this.selected(target)
      .map((anchor) => singlePeriodLabel(granularity, anchor, this.i18n.language()))
      .join(', ');
  }

  protected focusText(target: ComparisonTarget): string {
    return formatFocusLabel(
      this.comparison.granularity(),
      this.comparison.focus(target),
      this.i18n.language(),
    );
  }

  protected canShiftNext(target: ComparisonTarget): boolean {
    return this.comparison.canShiftFocusNext(target);
  }

  protected shiftFocus(target: ComparisonTarget, direction: 1 | -1): void {
    this.comparison.shiftFocus(target, direction);
  }

  protected goToday(target: ComparisonTarget): void {
    this.comparison.goToday(target);
  }

  protected granularityLabel(granularity: PeriodGranularity): string {
    return this.i18n.t(`dashboard.comparison.granularity.${granularity}` as TranslationKey);
  }

  protected setGranularity(granularity: PeriodGranularity): void {
    this.comparison.setGranularity(granularity);
  }

  protected panelDays(target: ComparisonTarget): readonly PanelDay[] {
    const focus = this.comparison.focus(target);
    const month = focus.getMonth();
    const today = toIsoDay(new Date());
    const days: PanelDay[] = [];

    for (const week of buildMonthMatrix(focus.getFullYear(), focus.getMonth() + 1)) {
      for (const date of week) {
        const key = toIsoDay(date);
        const inMonth = date.getMonth() === month;

        days.push({
          key,
          date,
          label: String(date.getDate()),
          inMonth,
          disabled: !inMonth || key > today,
        });
      }
    }

    return days;
  }

  protected dayClass(target: ComparisonTarget, day: PanelDay): string {
    const base =
      'flex h-9 min-w-0 touch-none select-none items-center justify-center rounded-md text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary focus-visible:ring-offset-1 focus-visible:ring-offset-app-secondary';

    if (!day.inMonth) {
      return `${base} text-app-muted/20`;
    }

    if (this.comparison.isSelected(target, day.date)) {
      return `${base} bg-app-primary font-semibold text-app-primary-fg active:scale-95`;
    }

    if (day.disabled) {
      return `${base} text-app-muted/40`;
    }

    return `${base} cursor-pointer bg-app-surface text-app-fg hover:bg-app-primary/10 active:scale-95`;
  }

  protected onDayClick(target: ComparisonTarget, day: PanelDay): void {
    if (this.consumeSuppressedClick() || day.disabled) {
      return;
    }

    this.comparison.toggle(target, day.date);
  }

  protected onDayPointerDown(event: PointerEvent, target: ComparisonTarget, day: PanelDay): void {
    if (day.disabled) {
      return;
    }

    this.startDrag(event, target, day.key, this.selectableCells(target));
  }

  protected panelOptions(target: ComparisonTarget): readonly PeriodOption[] {
    return buildPeriodOptions(
      this.comparison.granularity(),
      this.comparison.focus(target),
      this.i18n.language(),
      toIsoDay(new Date()),
    );
  }

  protected optionClass(target: ComparisonTarget, option: PeriodOption): string {
    const base =
      'flex min-h-9 min-w-0 touch-none select-none items-center justify-center truncate rounded-lg px-2 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary focus-visible:ring-offset-1 focus-visible:ring-offset-app-secondary';

    if (this.comparison.isSelected(target, option.anchor)) {
      return `${base} bg-app-primary text-app-primary-fg active:scale-[0.98]`;
    }

    if (option.disabled) {
      return `${base} text-app-muted/40`;
    }

    return `${base} cursor-pointer bg-app-surface text-app-fg ring-1 ring-inset ring-app-border hover:bg-app-primary/10 active:scale-[0.98]`;
  }

  protected onOptionClick(target: ComparisonTarget, option: PeriodOption): void {
    if (this.consumeSuppressedClick() || option.disabled) {
      return;
    }

    this.comparison.toggle(target, option.anchor);
  }

  protected onOptionPointerDown(
    event: PointerEvent,
    target: ComparisonTarget,
    option: PeriodOption,
  ): void {
    if (option.disabled) {
      return;
    }

    this.startDrag(event, target, option.key, this.selectableCells(target));
  }

  private selectableCells(target: ComparisonTarget): readonly CellRef[] {
    if (this.comparison.granularity() === 'day') {
      return this.panelDays(target)
        .filter((day) => !day.disabled)
        .map((day) => ({ key: day.key, date: day.date }));
    }

    return this.panelOptions(target)
      .filter((option) => !option.disabled)
      .map((option) => ({ key: option.key, date: option.anchor }));
  }

  private startDrag(
    event: PointerEvent,
    target: ComparisonTarget,
    key: string,
    cells: readonly CellRef[],
  ): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const order = cells.map((cell) => cell.key);
    const index = order.indexOf(key);

    if (index === -1) {
      return;
    }

    const datesByKey = new Map(cells.map((cell) => [cell.key, cell.date]));
    const anchor = datesByKey.get(key);

    if (anchor === undefined) {
      return;
    }

    this.suppressClickUntil = 0;
    this.drag = {
      target,
      mode: this.comparison.isSelected(target, anchor) ? 'remove' : 'add',
      snapshot: this.selected(target).slice(),
      order,
      datesByKey,
      startIndex: index,
      lastIndex: index,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };

    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const drag = this.drag;

    if (drag === null) {
      return;
    }

    if (!drag.moved) {
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);

      if (distance < 10) {
        return;
      }

      drag.moved = true;
    }

    event.preventDefault();

    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cell = element?.closest<HTMLElement>('[data-period-cell]');

    if (cell === null || cell === undefined) {
      return;
    }

    if (cell.dataset['target'] !== drag.target) {
      return;
    }

    const key = cell.dataset['anchor'];

    if (key === undefined) {
      return;
    }

    const index = drag.order.indexOf(key);

    if (index === -1) {
      return;
    }

    drag.lastIndex = index;
    this.applyDrag();
  };

  private readonly onPointerUp = (): void => {
    const drag = this.drag;

    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);

    if (drag !== null && drag.moved) {
      this.suppressClickUntil = Date.now() + 500;
    }

    this.drag = null;
  };

  private applyDrag(): void {
    const drag = this.drag;

    if (drag === null) {
      return;
    }

    const from = Math.min(drag.startIndex, drag.lastIndex);
    const to = Math.max(drag.startIndex, drag.lastIndex);
    const rangeDates = drag.order
      .slice(from, to + 1)
      .map((key) => drag.datesByKey.get(key))
      .filter((date): date is Date => date !== undefined);

    if (drag.mode === 'add') {
      const merged = new Map(drag.snapshot.map((date) => [toIsoDay(date), date]));

      for (const date of rangeDates) {
        merged.set(toIsoDay(date), date);
      }

      this.comparison.setSelection(drag.target, [...merged.values()]);

      return;
    }

    const removeKeys = new Set(rangeDates.map((date) => toIsoDay(date)));

    this.comparison.setSelection(
      drag.target,
      drag.snapshot.filter((date) => !removeKeys.has(toIsoDay(date))),
    );
  }

  private consumeSuppressedClick(): boolean {
    if (Date.now() < this.suppressClickUntil) {
      this.suppressClickUntil = 0;

      return true;
    }

    return false;
  }

  protected weekdayLabel(index: number): TranslationKey {
    return `dashboard.calendar.weekdays.${index}` as TranslationKey;
  }

  protected percentLabel(percent: number | null): string {
    if (percent === null) {
      return '—';
    }

    const rounded = Math.round(percent * 10) / 10;
    const sign = rounded > 0 ? '+' : '';

    return `${sign}${rounded}%`;
  }

  protected percentClass(percent: number | null): string {
    if (percent === null || percent === 0) {
      return 'text-app-muted';
    }

    return percent > 0 ? POSITIVE : NEGATIVE;
  }

  private selected(target: ComparisonTarget): readonly Date[] {
    return target === 'a' ? this.comparison.selectedA() : this.comparison.selectedB();
  }

  private categoryTotals(ranges: readonly PeriodRange[], kind: TopKind): Map<number, number> {
    if (kind === 'receivable' || kind === 'payable') {
      return groupAccountAmountBy(
        this.accountService.accounts(),
        ranges,
        kind,
        (account) => account.categoryId,
      );
    }

    return groupAmountBy(
      this.transactionService.transactions(),
      ranges,
      kind,
      (transaction) => transaction.categoryId,
    );
  }

  private contactTotals(ranges: readonly PeriodRange[], kind: TopKind): Map<number, number> {
    if (kind === 'receivable' || kind === 'payable') {
      return groupAccountAmountBy(
        this.accountService.accounts(),
        ranges,
        kind,
        (account) => account.contactId,
      );
    }

    return groupAmountBy(
      this.transactionService.transactions(),
      ranges,
      kind,
      (transaction) => transaction.contactId,
    );
  }

  private ranked(
    totals: Map<number, number>,
    names: Map<number, string>,
  ): readonly RankedItem[] {
    return [...totals.entries()]
      .map(([id, amount]) => ({ id, amount, label: names.get(id) ?? '' }))
      .filter((item) => item.label !== '')
      .sort((first, second) => second.amount - first.amount)
      .slice(0, 3);
  }
}
