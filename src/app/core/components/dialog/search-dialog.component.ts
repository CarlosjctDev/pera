import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Icon } from '@app/core/components/icons/icon.component';
import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { SearchField } from '@app/core/components/search/search-field.component';
import { SearchResults } from '@app/core/components/search/search-results.component';
import { T } from '@app/core/i18n/pipes/t.pipe';
import type { NavItem } from '@app/core/components/nav-icon/models/nav-icon.model';

export interface SearchDialogData {
  term: string;
  items: readonly NavItem[];
}

@Component({
  selector: 'app-search-dialog',
  imports: [DialogShellComponent, SearchField, SearchResults, Icon, T],
  template: `
    <app-dialog-shell [title]="'sidebar.dialogTitle' | t" [icon]="'search'">
      <app-search-field
        [value]="term()"
        [placeholder]="'sidebar.searchPlaceholder' | t"
        (valueChange)="onTermChange($event)"
        (submit)="apply()"
      />
      <div class="mt-3 max-h-60 overflow-y-auto overscroll-contain">
        <app-search-results
          [items]="data.items"
          [query]="term()"
          [selected]="selected()?.label ?? ''"
          (select)="onSelect($event)"
        />
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          (click)="cancel()"
          class="rounded-xl bg-app-secondary px-4 py-2.5 text-sm font-semibold text-app-secondary-fg ring-1 ring-inset ring-app-border transition hover:bg-app-secondary-hover hover:text-app-fg"
        >
          {{ 'common.cancel' | t }}
        </button>
        <button
          type="button"
          (click)="apply()"
          class="flex items-center gap-2 rounded-xl bg-app-primary px-4 py-2.5 text-sm font-semibold text-app-primary-fg shadow-lg shadow-black/10 transition hover:bg-app-primary-hover focus:ring-2 focus:ring-app-primary focus:ring-offset-2 focus:ring-offset-app-surface focus:outline-none"
        >
          <app-icon name="search" class="h-4 w-4" />
          {{ 'sidebar.dialogSubmit' | t }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDialogComponent {
  private readonly dialogRef = inject(DialogRef<string>);
  protected readonly data = inject<SearchDialogData>(DIALOG_DATA);
  protected readonly term = signal(this.data.term);
  protected readonly selected = signal<NavItem | null>(null);

  readonly termChange = output<string>();

  protected onTermChange(value: string): void {
    this.term.set(value);
    this.selected.set(null);
    this.termChange.emit(value);
  }

  protected onSelect(item: NavItem): void {
    this.selected.set(item);
    this.term.set(item.label);
    this.termChange.emit(item.label);
    this.dialogRef.close(item.label);
  }

  protected apply(): void {
    this.dialogRef.close(this.selected()?.label ?? this.term());
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
