import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  OnDestroy,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

import { ThemeService } from '@app/core/components/theme/services/theme.service';
import { I18nService } from '@app/core/i18n/i18n.service';
import type { TranslationKey, TranslationParams } from '@app/core/i18n/i18n.keys';

@Component({
  selector: 'app-toastr',
  imports: [NgxSonnerToaster],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :root {
        --ngx-sonner-border-radius: 0.75rem;
        --ngx-sonner-toast-normal-background: var(--color-app-surface);
        --ngx-sonner-toast-normal-border-color: var(--color-app-border);
        --ngx-sonner-toast-normal-color: var(--color-app-fg);
        --ngx-sonner-toast-success-background: var(--color-app-surface);
        --ngx-sonner-toast-success-border: var(--color-emerald-500);
        --ngx-sonner-toast-success-color: var(--color-emerald-600);
        --ngx-sonner-toast-info-background: var(--color-app-surface);
        --ngx-sonner-toast-info-border: var(--color-sky-500);
        --ngx-sonner-toast-info-color: var(--color-sky-600);
        --ngx-sonner-toast-warning-background: var(--color-app-surface);
        --ngx-sonner-toast-warning-border: var(--color-amber-500);
        --ngx-sonner-toast-warning-color: var(--color-amber-600);
        --ngx-sonner-toast-error-background: var(--color-app-surface);
        --ngx-sonner-toast-error-border: var(--color-red-500);
        --ngx-sonner-toast-error-color: var(--color-red-600);
      }

      html.dark {
        --ngx-sonner-toast-dark-normal-background: var(--color-app-surface);        
        --ngx-sonner-toast-dark-normal-color: var(--color-app-fg);

        --ngx-sonner-toast-dark-success-background: var(--color-app-surface);        
        --ngx-sonner-toast-dark-success-color: var(--color-emerald-400);

        --ngx-sonner-toast-dark-info-background: var(--color-app-surface);        
        --ngx-sonner-toast-dark-info-color: var(--color-sky-400);

        --ngx-sonner-toast-dark-warning-background: var(--color-app-surface);        
        --ngx-sonner-toast-dark-warning-color: var(--color-amber-400);

        --ngx-sonner-toast-dark-error-background: var(--color-app-surface);       
        --ngx-sonner-toast-dark-error-color: var(--color-red-400);
      }

      [data-sonner-toaster] {
        pointer-events: auto;
      }
    `,
  ],
  template: `
    <ngx-sonner-toaster
      [theme]="theme()"
      [position]="'top-right'"
      [duration]="3500"
      [closeButton]="true"
      [richColors]="true"
    />
  `,
})
export class ToastrComponent implements AfterViewInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  protected readonly theme = computed(() => this.themeService.resolved());

  private originalParent: HTMLElement | null = null;
  private originalNextSibling: ChildNode | null = null;
  private observer: MutationObserver | null = null;

  ngAfterViewInit(): void {
    this.originalParent = this.host.parentElement;
    this.originalNextSibling = this.host.nextSibling;

    this.observer = new MutationObserver(() => this.syncContainer());
    this.observer.observe(document.body, { childList: true, subtree: true });
    this.syncContainer();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.restore();
  }

  private syncContainer(): void {
    const popovers = document.querySelectorAll<HTMLElement>('.cdk-overlay-popover');
    const popover = popovers.length > 0 ? popovers[popovers.length - 1] : null;
    const target = popover ?? this.originalParent;

    if (target === null || this.host.parentElement === target) {
      return;
    }

    if (popover !== null) {
      target.appendChild(this.host);
    } else {
      this.restore();
    }
  }

  private restore(): void {
    const parent = this.originalParent;

    if (parent === null || this.host.parentElement === parent) {
      return;
    }

    const reference =
      this.originalNextSibling !== null && this.originalNextSibling.parentNode === parent
        ? this.originalNextSibling
        : null;

    parent.insertBefore(this.host, reference);
  }
}

@Injectable({ providedIn: 'root' })
export class ToastrService {
  private readonly i18n = inject(I18nService);

  success(key: TranslationKey, params?: TranslationParams): void {
    toast.success(this.i18n.t(key, params));
  }

  error(key: TranslationKey, params?: TranslationParams): void {
    toast.error(this.i18n.t(key, params));
  }

  info(key: TranslationKey, params?: TranslationParams): void {
    toast.info(this.i18n.t(key, params));
  }

  warning(key: TranslationKey, params?: TranslationParams): void {
    toast.warning(this.i18n.t(key, params));
  }
}
