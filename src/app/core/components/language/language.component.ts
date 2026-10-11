import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { LANGUAGE_NAMES } from '@app/core/i18n/const/config';
import { I18nService } from '@app/core/i18n/i18n.service';
import { T } from '@app/core/i18n/pipes/t.pipe';

import type { Language } from '@app/core/i18n/types/language';

@Component({
  selector: 'app-language',
  imports: [T],
  templateUrl: './language.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageComponent {
  readonly i18n = inject(I18nService);
  readonly compact = input(false);

  readonly options = computed<readonly { value: Language; label: string }[]>(() =>
    (Object.keys(LANGUAGE_NAMES) as Language[]).map((value) => ({
      value,
      label: LANGUAGE_NAMES[value],
    })),
  );

  protected setLanguage(language: Language): void {
    this.i18n.setLanguage(language);
  }

  protected buttonClass(value: Language): string {
    const active = this.i18n.language() === value;
    return [
      'flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm font-semibold sm:px-3',
      'cursor-pointer rounded-lg',
      'transition-colors duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary',

      active
        ? 'bg-app-primary text-app-primary-fg'
        : [
            'text-app-fg',
            'hover:bg-app-secondary-hover',
            'hover:text-app-secondary-fg',
            'active:bg-app-secondary-active',
          ].join(' '),
    ].join(' ');
  }
}