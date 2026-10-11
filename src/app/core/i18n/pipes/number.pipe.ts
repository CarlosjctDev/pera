import { Pipe, PipeTransform, inject } from '@angular/core';

import { I18nService } from '../i18n.service';

@Pipe({
  name: 'i18nNumber',
  pure: false,
})
export class I18nNumber implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.i18n.language(), options).format(value);
  }
}
