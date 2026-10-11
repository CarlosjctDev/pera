import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';

@Component({
  selector: 'app-nav-icon',
  imports: [Icon],
  template: `<app-icon [name]="icon()" class="h-5 w-5 shrink-0" />`,
  styles: [':host { display: inline-flex; align-items: center; justify-content: center; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavIcon {
  readonly icon = input<IconName>('income');
}
