import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { TemplateRef } from '@angular/core';

import { TippyDirective } from '@app/core/directives/tippy.directive';
import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import { SelectComponent } from '@app/core/components/select/select.component';
import { I18nService } from '@app/core/i18n/i18n.service';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';

import type {
  DataColumn,
  DataTableQuery,
  DataTableSearchTerms,
  DataTableSort,
} from './data-table.model';

const SEARCH_DEBOUNCE_MS = 300;

function isNumeric(value: unknown): value is number {
  return typeof value === 'number';
}

@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet, FormsModule, Icon, SelectComponent, T, TippyDirective],
  templateUrl: './data-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  private readonly i18n = inject(I18nService);

  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly DataColumn<T>[]>();
  readonly mode = input<'client' | 'server'>('client');
  readonly total = input(0);
  readonly loading = input(false);
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 20, 50, 100, -1]);
  readonly initialPageSize = input(0);
  readonly emptyLabel = input<TranslationKey>('table.empty');
  readonly maxHeight = input('28rem');
  readonly editTemplate = input<TemplateRef<unknown> | null>(null);
  readonly isRowEditing = input<(row: T) => boolean | undefined>();

  readonly queryChange = output<DataTableQuery>();

  readonly isServer = computed(() => this.mode() === 'server');

  protected readonly pageSizeChoices = computed(() => {
    const choices = new Set<number>(this.pageSizeOptions());
    return [...choices];
  });

  protected readonly pageSizeSelectOptions = computed(() =>
    this.pageSizeChoices().map((size) => ({
      value: size,
      label: size === -1 ? this.i18n.t('table.all') : String(size),
    })),
  );

  protected readonly searchTerms = signal<DataTableSearchTerms>({});
  protected readonly sort = signal<DataTableSort | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(this.initialPageSize() || (this.pageSizeOptions()[0] ?? 5));

  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly effectiveTotal = computed(() =>
    this.isServer() ? this.total() : this.sortedRows().length,
  );

  protected readonly pageCount = computed(() => {
    const size = this.pageSize();

    if (size === -1 || this.effectiveTotal() === 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(this.effectiveTotal() / size));
  });

  protected readonly rangeFrom = computed(() => {
    if (this.effectiveTotal() === 0) {
      return 0;
    }

    const size = this.pageSize();

    return size === -1 ? 1 : this.page() * size + 1;
  });

  protected readonly rangeTo = computed(() => {
    const total = this.effectiveTotal();

    if (total === 0) {
      return 0;
    }

    const size = this.pageSize();

    return size === -1 ? total : Math.min((this.page() + 1) * size, total);
  });

  protected readonly visibleRows = computed(() =>
    this.isServer() ? this.rows() : this.paginatedRows(),
  );

  protected readonly filteredRows = computed(() => {
    const terms = this.searchTerms();
    const columns = this.columns();

    return this.rows().filter((row) => this.matchesRow(row, columns, terms));
  });

  protected readonly sortedRows = computed(() => {
    const rows = this.filteredRows();
    const current = this.sort();

    if (current === null) {
      return rows;
    }

    const column = this.columns().find((candidate) => candidate.key === current.key);

    if (column === undefined) {
      return rows;
    }

    const dir = current.dir === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      const aValue = this.cellValue(a, column);
      const bValue = this.cellValue(b, column);

      if (isNumeric(aValue) && isNumeric(bValue)) {
        return (aValue - bValue) * dir;
      }

      return String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' }) * dir;
    });
  });

  protected readonly paginatedRows = computed(() => {
    const rows = this.sortedRows();
    const size = this.pageSize();

    if (size === -1) {
      return rows;
    }

    const start = this.page() * size;

    return rows.slice(start, start + size);
  });

  constructor() {
    effect(() => {
      const size = this.pageSize();
      const count = this.pageCount();
      const current = this.page();

      if (size === -1) {
        if (current !== 0) {
          this.page.set(0);
        }
        return;
      }

      if (count > 0 && current >= count) {
        this.page.set(Math.max(0, count - 1));
        this.scheduleQuery();
      }
    });
  }

  protected onSearchInput(column: DataColumn<T>, event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerms.update((terms) => ({ ...terms, [column.key]: value }));
    this.page.set(0);
    this.scheduleDebounced();
  }

  protected toggleSort(column: DataColumn<T>): void {
    const current = this.sort();

    const next: DataTableSort =
      current?.key === column.key && current.dir === 'asc'
        ? { key: column.key, dir: 'desc' }
        : { key: column.key, dir: 'asc' };

    this.sort.set(next);
    this.page.set(0);
    this.scheduleQuery();
  }

  protected isSorted(column: DataColumn<T>): boolean {
    return this.sort()?.key === column.key;
  }

  protected sortIcon(column: DataColumn<T>): IconName {
    return this.sort()?.dir === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  protected previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  protected nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  protected goToPage(page: number): void {
    const next = Math.min(Math.max(page, 0), this.pageCount() - 1);

    if (next === this.page()) {
      return;
    }

    this.page.set(next);
    this.scheduleQuery();
  }

  protected onPageSizeChange(value: number | null): void {
    if (typeof value !== 'number' || value === this.pageSize()) {
      return;
    }

    this.pageSize.set(value);
    this.page.set(0);
    this.scheduleQuery();
  }

  protected formatValue(row: T, column: DataColumn<T>): string {
    const value = this.cellValue(row, column);

    return isNumeric(value) ? String(value) : value;
  }

  protected rowId(row: T): unknown {
    const record = row as Partial<{ id?: unknown }>;

    return record.id ?? row;
  }

  protected headerClass(column: DataColumn<T>): string {
    return `sticky top-0 z-10 bg-app-secondary px-3 py-2 font-semibold text-app-muted ${this.alignText(column)}`;
  }

  protected cellClass(column: DataColumn<T>): string {
    return `px-3 py-2 align-middle ${column.widthClass ?? ''} ${this.alignText(column)}`;
  }

  private alignText(column: DataColumn<T>): string {
    if (column.align === 'right') {
      return 'text-right';
    }

    if (column.align === 'center') {
      return 'text-center';
    }

    return 'text-left';
  }

  private matchesRow(
    row: T,
    columns: readonly DataColumn<T>[],
    terms: DataTableSearchTerms,
  ): boolean {
    for (const column of columns) {
      const rawTerm = terms[column.key];

      if (!column.searchable || rawTerm === undefined || rawTerm === '') {
        continue;
      }

      const term = normalizeText(rawTerm).toLowerCase();

      if (term === '') {
        continue;
      }

      const value = normalizeText(String(this.cellValue(row, column))).toLowerCase();

      if (!value.includes(term)) {
        return false;
      }
    }

    return true;
  }

  private cellValue(row: T, column: DataColumn<T>): string | number {
    if (column.render !== undefined) {
      return column.render(row);
    }

    const value = (row as Record<string, unknown>)[column.key];

    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return '';
  }

  private scheduleQuery(): void {
    if (!this.isServer()) {
      return;
    }

    this.clearTimer();
    this.queryChange.emit(this.currentQuery());
  }

  private scheduleDebounced(): void {
    if (!this.isServer()) {
      return;
    }

    this.clearTimer();

    const query = this.currentQuery();

    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.queryChange.emit(query);
    }, SEARCH_DEBOUNCE_MS);
  }

  private currentQuery(): DataTableQuery {
    return {
      page: this.page(),
      pageSize: this.pageSize(),
      sort: this.sort(),
      searchTerms: this.searchTerms(),
    };
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
