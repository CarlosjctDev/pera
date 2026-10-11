import { effect, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'app-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly preferenceState = signal<ThemePreference>(this.loadPreference());
  private readonly resolvedState = signal<'light' | 'dark'>('light');

  readonly preference = this.preferenceState.asReadonly();
  readonly resolved = this.resolvedState.asReadonly();

  private readonly media =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  constructor() {
    effect(() => this.apply(this.preferenceState()));
    this.media?.addEventListener?.('change', () => this.apply(this.preferenceState()));
  }

  setPreference(value: ThemePreference): void {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Almacenamiento no disponible: se conserva solo en memoria.
    }
    this.preferenceState.set(value);
  }

  private resolve(preference: ThemePreference): 'light' | 'dark' {
    if (preference === 'system') {
      return this.media?.matches ? 'dark' : 'light';
    }
    return preference;
  }

  private apply(preference: ThemePreference): void {
    const dark = this.resolve(preference) === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    this.resolvedState.set(dark ? 'dark' : 'light');
  }

  private loadPreference(): ThemePreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // Almacenamiento no disponible: se usa el tema del sistema.
    }
    return 'system';
  }
}
