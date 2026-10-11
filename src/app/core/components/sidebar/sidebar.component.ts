import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '@app/core/components/icons/icon.component';
import { NavIcon } from '@app/core/components/nav-icon/nav-icon.component';
import { SearchField } from '@app/core/components/search/search-field.component';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import type { SidebarItem } from '@app/core/models/sidebar.model';

@Component({
  selector: 'app-sidebar',
  imports: [NavIcon, SearchField, TippyDirective, Icon, T],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly items = input.required<readonly SidebarItem[]>();
  readonly collapsed = input(false);
  readonly filter = input('');
  readonly open = input(false);

  readonly collapsedChange = output<boolean>();
  readonly filterChange = output<string>();
  readonly itemSelected = output<SidebarItem>();
  readonly searchRequested = output<void>();

  protected toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  protected onFilterChange(value: string): void {
    this.filterChange.emit(value);
  }

  protected selectItem(item: SidebarItem): void {
    if (!item.enabled) {
      return;
    }
    this.itemSelected.emit(item);
  }
}
