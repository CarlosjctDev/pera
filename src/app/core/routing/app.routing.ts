import type { TranslationKey } from '@app/core/i18n/i18n.keys';

export const APP_ROUTES = {

  welcome: {
    path: 'welcome',
    titleKey: 'welcome.title',
  },

  dashboard: {
    path: 'dashboard',
    titleKey: 'nav.dashboard',
  },

  movements: {
    path: 'movements',
    titleKey: 'nav.movements',
  },

  masterData: {
    path: 'master-data',
    titleKey: 'nav.masterData',
  },

  masterDataCategories: {
    path: 'categories',
    titleKey: 'masterData.categoriesTitle',
  },

  masterDataRelationships: {
    path: 'relationships',
    titleKey: 'masterData.relationshipsTitle',
  },

  masterDataContacts: {
    path: 'contacts',
    titleKey: 'masterData.contactsTitle',
  },

  profile: {
    path: 'profile',
    titleKey: 'nav.profile',
  },

  settings: {
    path: 'settings',
    titleKey: 'nav.settings',
  },
} as const satisfies Record<
  string,
  {
    path: string;
    titleKey: TranslationKey;
  }
>;
