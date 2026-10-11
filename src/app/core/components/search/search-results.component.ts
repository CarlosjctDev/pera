import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '@app/core/components/icons/icon.component';
import { NavIcon } from '@app/core/components/nav-icon/nav-icon.component';
import { T } from '@app/core/i18n/pipes/t.pipe';
import type { NavItem } from '@app/core/components/nav-icon/models/nav-icon.model';

@Component({
  selector: 'app-search-results',
  imports: [NavIcon, Icon, T],
  template: `
    @if (results().length > 0) {
      <ul class="flex flex-col gap-1">
        @for (item of results(); track item.label) {
          <li>
            <button
              type="button"
              (click)="selectItem(item)"
              [attr.aria-disabled]="item.enabled ? null : 'true'"
              [attr.aria-pressed]="isSelected(item) ? 'true' : null"
              [attr.data-selected]="isSelected(item) ? 'true' : null"
              class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors"
              [class.cursor-pointer]="item.enabled"
              [class.hover:bg-app-secondary]="item.enabled"
              [class.text-app-fg]="item.enabled"
              [class.cursor-not-allowed]="!item.enabled"
              [class.text-app-muted]="!item.enabled"
              [class.bg-app-primary/10]="isSelected(item)"
              [class.ring-1]="isSelected(item)"
              [class.ring-inset]="isSelected(item)"
              [class.ring-app-primary/30]="isSelected(item)"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
                [class.bg-app-primary]="item.enabled"
                [class.text-app-primary-fg]="item.enabled"
                [class.shadow-lg]="item.enabled"
                [class.shadow-black/10]="item.enabled"
                [class.bg-app-secondary]="!item.enabled"
                [class.text-app-muted]="!item.enabled"
              >
                <app-nav-icon [icon]="item.icon" />
              </span>
              <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              @if (isSelected(item)) {
                <app-icon
                  name="check"
                  class="h-4 w-4 shrink-0 text-app-primary"
                  [strokeWidth]="2.5"
                />
              }
              @if (!item.enabled) {
                <span
                  class="rounded-full bg-app-secondary px-2 py-0.5 text-[10px] font-medium text-app-muted"
                >
                  {{ 'sidebar.soon' | t }}
                </span>
              }
            </button>
          </li>
        }
      </ul>
    } @else {
      <p class="rounded-xl bg-app-secondary/70 px-3 py-4 text-center text-xs text-app-muted">
        {{ 'sidebar.empty' | t }}
      </p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResults {
  readonly items = input<readonly NavItem[]>([]);
  readonly query = input('');
  readonly selected = input('');

  readonly select = output<NavItem>();

  protected readonly results = computed(() => {
    const all = this.items() ?? [];
    const term = this.query().trim().toLowerCase();
    if (!term) {
      return all;
    }
    return all.filter((item) => item.label.toLowerCase().includes(term));
  });

  protected selectItem(item: NavItem): void {
    if (!item.enabled) {
      return;
    }
    this.select.emit(item);
  }

  protected isSelected(item: NavItem): boolean {
    return item.enabled && item.label === this.selected();
  }
}
