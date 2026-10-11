import { Pipe, PipeTransform, inject } from '@angular/core';

import { I18nService } from '../i18n.service';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

@Pipe({
  name: 'bytes',
  pure: false,
})
export class Bytes implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return `0 ${BYTE_UNITS[0]}`;
    }

    const index = Math.min(BYTE_UNITS.length - 1, Math.floor(Math.log(value) / Math.log(1024)));

    const amount = value / 1024 ** index;
    const formatted = new Intl.NumberFormat(this.i18n.language(), {
      maximumFractionDigits: index === 0 ? 0 : 1,
    }).format(amount);

    return `${formatted} ${BYTE_UNITS[index]}`;
  }
}
