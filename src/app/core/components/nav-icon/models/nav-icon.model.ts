import type { IconName } from '@app/core/components/icons/model/icon.model';

export interface NavItem {
  label: string;
  icon: IconName;
  enabled: boolean;
}