import { Pipe, PipeTransform, inject } from '@angular/core';
import { format, type DateArg, type Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';

import { I18nService } from '../i18n.service';

import type { Language } from '../types/language';

const DATE_LOCALES: Record<Language, Locale> = {
  es,
  en: enUS,
};

@Pipe({
  name: 'i18nDate',
  pure: false,
})
export class I18nDate implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: DateArg<Date>, pattern = 'PP'): string {
    return format(value, pattern, { locale: DATE_LOCALES[this.i18n.language()] });
  }
}
