import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import { ThemePreference, ThemeService } from '@app/core/components/theme/services/theme.service';
import { I18nService } from '@app/core/i18n/i18n.service';
import { T } from '@app/core/i18n/pipes/t.pipe';

@Component({
  selector: 'app-theme',
  imports: [Icon, T],
  templateUrl: './theme.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeComponent {
  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);
  readonly compact = input(false);

  readonly options = computed<readonly { value: ThemePreference; label: string; icon: IconName }[]>(
    () => [
      { value: 'light', label: this.i18n.t('settings.theme.light'), icon: 'theme-light' },
      { value: 'dark', label: this.i18n.t('settings.theme.dark'), icon: 'theme-dark' },
      { value: 'system', label: this.i18n.t('settings.theme.system'), icon: 'theme-system' },
    ],
  );

  protected buttonClass(value: ThemePreference): string {
    const active = this.theme.preference() === value;
    return [
      'flex items-center justify-center gap-1.5 sm:gap-2',
      'cursor-pointer rounded-lg px-2.5 py-2 text-sm font-semibold sm:px-3',
      'transition-colors duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary',

      active
        ? 'bg-app-primary text-app-primary-fg'
        : [
            'text-app-fg',
            'hover:bg-app-secondary-hover',
            'hover:text-app-secondary-fg',
            'active:bg-app-secondary-active',
          ].join(' '),
    ].join(' ');
  }
}