import en from '../languages/en.json';
import es from '../languages/es.json';

import type { Translations } from '../i18n.keys';
import type { Language } from '../types/language';

export const DEFAULT_LANGUAGE: Language = 'en';

export const LANGUAGE_NAMES: Record<Language, string> = {
  es: 'Español',
  en: 'English',
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_NAMES) as Language[];

export const TRANSLATIONS: Record<Language, Translations> = {
  es,
  en,
};
