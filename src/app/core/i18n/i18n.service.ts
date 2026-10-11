import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, TRANSLATIONS } from './const/config';

import type { TranslationKey, TranslationParams, Translations } from './i18n.keys';
import type { Language } from './types/language';

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

const STORAGE_KEY = 'app-language';

function isLanguage(value: string | null): value is Language {
  return typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as Language);
}

function lookup(translations: Translations, key: TranslationKey): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      translations,
    );

  return typeof value === 'string' ? value : key;
}

function interpolate(text: string, params: TranslationParams): string {
  return text.replace(PLACEHOLDER, (placeholder, name: string) => {
    const value = params[name];

    return value === undefined ? placeholder : String(value);
  });
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly _language = signal<Language>(this.loadLanguage());

  readonly language = this._language.asReadonly();

  private readonly translations = computed(() => TRANSLATIONS[this._language()]);

  constructor() {
    effect(() => {
      const language = this._language();

      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
      }
    });

    this.watchBrowserLanguage();
  }

  t(key: TranslationKey, params?: TranslationParams): string {
    const text = lookup(this.translations(), key);

    return params ? interpolate(text, params) : text;
  }

  setLanguage(language: Language): void {
    this.persist(language);
    this._language.set(language);
  }

  private loadLanguage(): Language {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (isLanguage(stored)) {
        return stored;
      }
    } catch {
      // Almacenamiento no disponible: se usa el idioma por defecto.
    }

    return DEFAULT_LANGUAGE;
  }

  private persist(language: Language): void {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Almacenamiento no disponible: se conserva solo en memoria.
    }
  }

  private getBrowserLanguage(): Language {
    if (typeof navigator === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    const browserLanguage = navigator.language.toLowerCase().split('-')[0];

    return isLanguage(browserLanguage) ? browserLanguage : DEFAULT_LANGUAGE;
  }

  private watchBrowserLanguage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const onLanguageChange = (): void => this.setLanguage(this.getBrowserLanguage());

    window.addEventListener('languagechange', onLanguageChange);

    inject(DestroyRef).onDestroy(() =>
      window.removeEventListener('languagechange', onLanguageChange),
    );
  }
}
