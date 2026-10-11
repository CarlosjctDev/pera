import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ICON_SET } from './const/icon.const';
import type { IconName } from './model/icon.model';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly strokeWidth = input(2);

  protected readonly icon = computed(() => ICON_SET[this.name()]);
}
