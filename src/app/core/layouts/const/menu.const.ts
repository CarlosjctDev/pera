import type { IconName } from '@app/core/components/icons/model/icon.model';
import type { TranslationKey } from '@app/core/i18n/i18n.keys';
import { APP_ROUTES } from '@app/core/routing/app.routing';

export type MenuKey = Exclude<keyof typeof APP_ROUTES, 'home' | 'welcome'>;

export type MenuLabelKey = Extract<TranslationKey, `nav.${MenuKey}`>;

export interface MenuItem<K extends MenuKey = MenuKey> {
  readonly key: K;
  readonly labelKey: MenuLabelKey;
  readonly icon: IconName;
  readonly route: string;
  readonly enabled: boolean;
}

export const MENU_ITEMS = [
  {
    key: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: 'report',
    route: APP_ROUTES.dashboard.path,
    enabled: true,
  },
  {
    key: 'movements',
    labelKey: 'nav.movements',
    icon: 'transactions',
    route: APP_ROUTES.movements.path,
    enabled: true,
  },
  {
    key: 'masterData',
    labelKey: 'nav.masterData',
    icon: 'database',
    route: APP_ROUTES.masterData.path,
    enabled: true,
  },
  {
    key: 'settings',
    labelKey: 'nav.settings',
    icon: 'settings',
    route: APP_ROUTES.settings.path,
    enabled: true,
  },
] as const satisfies readonly MenuItem[];
