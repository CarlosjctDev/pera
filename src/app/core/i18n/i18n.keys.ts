import type es from './languages/es.json';

type Strings<T> = {
  [K in keyof T]: T[K] extends string ? string : Strings<T[K]>;
};

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : K) : never;

type Leaves<T> = {
  [K in keyof T & string]: T[K] extends string ? K : Join<K, Leaves<T[K]>>;
}[keyof T & string];

export type Translations = Strings<typeof es>;

export type TranslationKey = Leaves<Translations>;

export type TranslationParams = Readonly<Record<string, string | number>>;
