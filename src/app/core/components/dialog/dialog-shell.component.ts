import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

import { Icon } from '@app/core/components/icons/icon.component';
import type { IconName } from '@app/core/components/icons/model/icon.model';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { T } from '@app/core/i18n/pipes/t.pipe';

type ShellIcon =
  | 'logout'
  | 'warning'
  | 'search'
  | 'save'
  | 'database'
  | 'activity-log'
  | 'file'
  | 'info'
  | 'paperclip'
  | 'wallet'
  | 'security';

@Component({
  selector: 'app-dialog-shell',
  imports: [TippyDirective, Icon, T],
  template: `
    <section
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
      [style.max-width]="maxWidth()"
      class="dialog-in flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-app-surface/95 p-4 shadow-2xl shadow-black/10 ring-1 ring-app-border backdrop-blur sm:p-6"
    >
      <header class="flex shrink-0 items-start justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          @if (iconName(); as icon) {
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-primary text-app-primary-fg"
            >
              <app-icon [name]="icon" class="h-5 w-5" />
            </div>
          }
          <h2
            class="min-w-0 truncate text-lg font-semibold tracking-tight text-app-surface-fg"
            [title]="title()"
          >
            {{ title() }}
          </h2>
        </div>
        <button
          type="button"
          (click)="closeFromShell()"
          [attr.aria-label]="'common.close' | t"
          [tippy]="'common.close' | t"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-app-muted transition hover:bg-app-secondary hover:text-app-fg focus-visible:ring-2 focus-visible:ring-app-primary focus-visible:ring-offset-1 focus-visible:ring-offset-app-surface focus-visible:outline-none"
        >
          <app-icon name="close" class="h-4 w-4" />
        </button>
      </header>
      <div class="mt-4">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      @keyframes dialog-in {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .dialog-in {
        animation: dialog-in 0.25s ease-out;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogShellComponent implements OnDestroy {
  readonly title = input<string>('');
  readonly icon = input<ShellIcon | ''>('');
  readonly maxWidth = input<string>('');

  protected readonly iconName = computed<IconName | null>(() => this.icon() || null);

  private readonly dialogRef = inject(DialogRef<unknown>, { optional: true });
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  constructor() {
    // Como el overlay pasa a ser el contenedor de scroll (estilo SweetAlert),
    // cubre toda la pantalla y el backdrop de CDK ya no recibe los clics.
    // Se replica el cierre por clic fuera respetando los defaults de CDK.
    if (
      this.dialogRef != null &&
      this.dialogRef.config.disableClose !== true &&
      this.dialogRef.config.hasBackdrop !== false
    ) {
      document.addEventListener('pointerdown', this.onBackdropPointerDown, true);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('pointerdown', this.onBackdropPointerDown, true);
  }

  protected closeFromShell(): void {
    this.dialogRef?.close();
  }

  private readonly onBackdropPointerDown = (event: PointerEvent): void => {
    const dialogRef = this.dialogRef;
    const target = event.target;

    if (dialogRef == null || !(target instanceof Element) || this.host.contains(target)) {
      return;
    }

    // Interacción con otros overlays (tooltips, etc.) no cierra el diálogo.
    if (target.closest('[data-tippy-root]')) {
      return;
    }

    const pane = target.closest<HTMLElement>('.cdk-overlay-pane');

    if (pane != null && !this.host.contains(pane)) {
      return;
    }

    // Un clic en la barra de scroll del overlay no debe cerrar el diálogo.
    const scroller = target.closest<HTMLElement>('.cdk-global-overlay-wrapper');

    if (scroller != null && this.isScrollbarHit(scroller, event.clientX)) {
      return;
    }

    dialogRef.close(undefined, { focusOrigin: 'mouse' });
  };

  private isScrollbarHit(scroller: HTMLElement, clientX: number): boolean {
    const reserved = scroller.offsetWidth - scroller.clientWidth;

    if (reserved <= 0) {
      return false;
    }

    return clientX >= scroller.getBoundingClientRect().right - reserved;
  }
}
