import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '@app/core/components/sidebar/sidebar.component';
import { TopbarComponent } from '@app/core/components/topbar/topbar.component';
import { I18nService } from '@app/core/i18n/i18n.service';
import { LayoutService } from '@app/core/layouts/layout.service';
import { ProfileService } from '@app/features/profile/services/profile.service';

import type { TopbarAction } from '@app/core/components/topbar/topbar.component';
import { EnvironmentService } from '@env/enviroment.service';

const TOPBAR_ACTION_ROUTES: Readonly<Record<string, string>> = {
  'topbar-profile': '/profile',
};

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, TopbarComponent],
  host: {
    class: 'flex h-screen flex-col',
  },
  templateUrl: './app.layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {
  protected readonly environment = inject(EnvironmentService);
  protected readonly layout = inject(LayoutService);

  private readonly profile = inject(ProfileService);
  private readonly i18n = inject(I18nService);

  protected readonly initials = computed(() => {
    const parts = this.profile.name().trim().split(/\s+/).filter(Boolean);

    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  protected readonly avatarTip = computed(() => this.profile.name());

  protected readonly topbarActions = computed<readonly TopbarAction[]>(() => [
    {
      label: this.i18n.t('nav.profile'),
      icon: 'user',
      testId: 'topbar-profile',
      accent: 'primary',
    },
  ]);

  protected onAction(action: TopbarAction): void {
    const route = TOPBAR_ACTION_ROUTES[action.testId ?? ''];

    if (route) {
      this.layout.navigate(route);
    }
  }
}
