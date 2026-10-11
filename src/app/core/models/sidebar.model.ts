import type { IconName } from '@app/core/components/icons/model/icon.model';

export interface SidebarItem {
  readonly label: string;
  readonly icon: IconName;
  readonly enabled: boolean;
  readonly active: boolean;
  readonly testId?: string;
}
