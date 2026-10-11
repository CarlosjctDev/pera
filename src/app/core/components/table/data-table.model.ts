import type { TemplateRef } from '@angular/core';

import type { TranslationKey } from '@app/core/i18n/i18n.keys';

export interface DataColumn<T> {
  readonly key: string;
  readonly labelKey: TranslationKey;
  readonly searchable?: boolean;
  readonly sortable?: boolean;
  readonly align?: 'left' | 'right' | 'center';
  readonly widthClass?: string;
  readonly render?: (row: T) => string | number;
  readonly cellTemplate?: TemplateRef<unknown>;
}

export interface DataTableSort {
  readonly key: string;
  readonly dir: 'asc' | 'desc';
}

export interface DataTableSearchTerms {
  readonly [key: string]: string;
}

export interface DataTableQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly sort: DataTableSort | null;
  readonly searchTerms: Readonly<DataTableSearchTerms>;
}
