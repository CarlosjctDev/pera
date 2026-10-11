import { computed, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { NavigationEnd, Router } from '@angular/router';

import { SearchDialogComponent } from '@app/core/components/dialog/search-dialog.component';
import { I18nService } from '@app/core/i18n/i18n.service';
import { MENU_ITEMS } from '@app/core/layouts/const/menu.const';

import { filter, map } from 'rxjs';

import type { SearchDialogData } from '@app/core/components/dialog/search-dialog.component';
import type { SidebarItem } from '@app/core/models/sidebar.model';
import type { MenuItem } from '@app/core/layouts/const/menu.const';
import { APP_ROUTES } from '../routing/app.routing';

const COLLAPSED_STORAGE_KEY = 'pera.sidebar.collapsed';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(Dialog);

  private readonly _sidebarCollapsed = signal(this.loadCollapsed());
  private readonly _sidebarOpen = signal(false);
  private readonly _menuFilter = signal('');
  private readonly _currentUrl = signal(this.router.url);

  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();
  readonly sidebarOpen = this._sidebarOpen.asReadonly();
  readonly menuFilter = this._menuFilter.asReadonly();

  readonly sidebarItems = computed<readonly SidebarItem[]>(() => {
    const term = this._menuFilter().trim().toLowerCase();
    const items = MENU_ITEMS.map((item) => this.toSidebarItem(item));

    if (!term) {
      return items;
    }

    return items.filter((item) => item.label.toLowerCase().includes(term));
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map((event) => event.urlAfterRedirects),
        takeUntilDestroyed(),
      )
      .subscribe((url) => this._currentUrl.set(url));
  }

  setCollapsed(collapsed: boolean): void {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
    } catch {
      // Almacenamiento no disponible: el estado se conserva solo en memoria.
    }
    this._sidebarCollapsed.set(collapsed);
  }

  setOpen(open: boolean): void {
    this._sidebarOpen.set(open);
  }

  toggleOpen(): void {
    this._sidebarOpen.update((open) => !open);
  }

  setFilter(value: string): void {
    this._menuFilter.set(value);
  }

  goHome(): void {
    this.navigate(`/${APP_ROUTES.welcome.path}`);
  }

  navigate(url: string): void {
    this._sidebarOpen.set(false);
    void this.router.navigateByUrl(url);
  }

  selectItem(item: SidebarItem): void {
    const definition = MENU_ITEMS.find((entry) => this.testId(entry) === item.testId);

    if (!item.enabled || !definition?.enabled) {
      return;
    }

    this.navigate(this.routeUrl(definition));
  }

  openSearchDialog(): void {
    const items = this.sidebarItems().map((item) => ({
      label: item.label,
      icon: item.icon,
      enabled: item.enabled,
    }));

    const dialogRef = this.dialog.open<SearchDialogComponent, SearchDialogData>(
      SearchDialogComponent,
      {
        data: { term: this._menuFilter(), items },
        maxWidth: 'min(92vw, 28rem)',
        autoFocus: false,
      },
    );

    this._sidebarOpen.set(false);

    dialogRef.closed.subscribe((result) => {
      if (typeof result !== 'string') {
        return;
      }

      const selected = this.sidebarItems().find((item) => item.label === result);

      if (selected) {
        this._menuFilter.set('');
        this.selectItem(selected);
        return;
      }

      this._menuFilter.set(result);
    });
  }

  private toSidebarItem(item: MenuItem): SidebarItem {
    return {
      label: this.i18n.t(item.labelKey),
      icon: item.icon,
      enabled: item.enabled,
      active: this.isActive(item),
      testId: this.testId(item),
    };
  }

  private isActive(item: MenuItem): boolean {
    if (!item.enabled) {
      return false;
    }

    const path = this.normalizePath(this._currentUrl());

    if (item.route === '') {
      return path === '/';
    }

    const url = this.routeUrl(item);

    return path === url || path.startsWith(`${url}/`);
  }

  private normalizePath(url: string): string {
    return url.split(/[?#]/)[0] || '/';
  }

  private routeUrl(item: MenuItem): string {
    return item.route === '' ? '/' : `/${item.route}`;
  }

  private testId(item: MenuItem): string {
    return `nav-${item.key}`;
  }

  private loadCollapsed(): boolean {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      // Almacenamiento no disponible: el menú arranca expandido.
      return false;
    }
  }
}
