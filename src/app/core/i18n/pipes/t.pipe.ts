import { Pipe, PipeTransform, inject } from '@angular/core';

import { I18nService } from '../i18n.service';

import type { TranslationKey, TranslationParams } from '../i18n.keys';

@Pipe({
  name: 't',
  pure: false,
})
export class T implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey | null | undefined, params?: TranslationParams): string {
    if (key === null || key === undefined) {
      return '';
    }

    return this.i18n.t(key, params);
  }
}
