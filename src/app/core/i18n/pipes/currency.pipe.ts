import { Pipe, PipeTransform, inject } from '@angular/core';

import { I18nService } from '../i18n.service';

import { DEFAULT_CURRENCY } from '@app/features/profile/models/currency.model';

import type { CurrencyCode } from '@app/features/profile/models/currency.model';

@Pipe({
  name: 'i18nCurrency',
  pure: false,
})
export class I18nCurrency implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
    return new Intl.NumberFormat(this.i18n.language(), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(value);
  }
}
