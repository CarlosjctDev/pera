import { Injectable, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { I18nService } from './i18n.service';

import type { TranslationKey } from './i18n.keys';

@Injectable({
  providedIn: 'root',
})
export class I18nTitleStrategy extends TitleStrategy {
  private readonly browserTitle = inject(Title);
  private readonly i18n = inject(I18nService);

  private snapshot: RouterStateSnapshot | null = null;

  constructor() {
    super();

    effect(() => {
      this.i18n.language();

      if (this.snapshot) {
        this.apply(this.snapshot);
      }
    });
  }

  updateTitle(snapshot: RouterStateSnapshot): void {
    this.snapshot = snapshot;
    this.apply(snapshot);
  }

  private apply(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot);

    if (key) {
      this.browserTitle.setTitle(this.i18n.t(key as TranslationKey));
    }
  }
}
