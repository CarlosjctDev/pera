import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { TitleStrategy, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { PERSISTENCE_PROVIDERS } from './adapters/persistence/persistence.providers';
import { I18nService } from './core/i18n/i18n.service';
import { I18nTitleStrategy } from './core/i18n/i18n-title.strategy';
import { ContactService } from './features/master-data/services/contact.service';
import { ProfileService } from './features/profile/services/profile.service';
import { ScheduledMovementService } from './features/transactions/services/scheduled-movement.service';
import { provideServiceWorker } from '@angular/service-worker';

registerLocaleData(localeEn);
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: TitleStrategy, useClass: I18nTitleStrategy },
    { provide: LOCALE_ID, useFactory: () => inject(I18nService).language() },
    provideAppInitializer(async () => {
      const profile = inject(ProfileService);
      const contacts = inject(ContactService);

      await profile.load();
      await contacts.load();
    }),
    provideAppInitializer(() => inject(ScheduledMovementService).generateDue()),
    ...PERSISTENCE_PROVIDERS,
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
