import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Icon } from '@app/core/components/icons/icon.component';
import { ThemeComponent } from '@app/core/components/theme/theme.component';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { T } from '@app/core/i18n/pipes/t.pipe';

export type TopbarActionIcon = 'user' | 'globe';

export interface TopbarAction {
  readonly label: string;
  readonly icon: TopbarActionIcon;
  readonly testId?: string;
  readonly accent: 'neutral' | 'primary';
}

const ACTION_CLASSES: Record<TopbarAction['accent'], string> = {
  neutral:
    'flex h-10 w-10 items-center justify-center rounded-xl bg-app-secondary text-app-secondary-fg ring-1 ring-inset ring-app-border transition hover:bg-app-secondary-hover',
  primary:
    'flex h-10 w-10 items-center justify-center rounded-xl bg-app-primary/10 text-app-primary ring-1 ring-inset ring-app-border transition hover:bg-app-primary hover:text-app-primary-fg',
};

@Component({
  selector: 'app-topbar',
  imports: [ThemeComponent, TippyDirective, Icon, T],
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  readonly title = input<string>('');
  readonly showTitle = input(false);
  readonly initials = input<string>('');
  readonly avatarTip = input<string>('');
  readonly showSidebarToggle = input(false);
  readonly actions = input<readonly TopbarAction[]>([]);

  readonly sidebarToggle = output<void>();
  readonly home = output<void>();
  readonly actionClicked = output<TopbarAction>();

  protected actionClass(accent: TopbarAction['accent']): string {
    return ACTION_CLASSES[accent];
  }
}
