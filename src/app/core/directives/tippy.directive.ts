import { DestroyRef, Directive, ElementRef, effect, inject, input } from '@angular/core';
import tippy, { type Instance, type Placement } from 'tippy.js';

@Directive({
  selector: '[tippy]',
})
export class TippyDirective {
  readonly tippy = input<string>('');
  readonly tippyPlacement = input<Placement>('top');
  readonly tippyEnabled = input<boolean>(true);

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private instance: Instance | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const content = this.tippy().trim();
      const enabled = this.tippyEnabled();
      const placement = this.tippyPlacement();

      // No crear Tippy si no hay contenido
      if (!content) {
        this.destroyInstance();
        this.element.removeAttribute('title');
        return;
      }

      // Crear instancia solamente cuando sea necesaria
      if (!this.instance) {        
        const created = tippy(this.element, {
          content,
          placement,
          trigger: 'mouseenter focus',
          touch: 'hold',
          allowHTML: false,
          interactive: false,
          appendTo: () =>
            this.element.closest('.cdk-overlay-popover')
            ?? document.body,     
          zIndex: 20000,
          
        });

        this.instance = Array.isArray(created) ? created[0] : created;
      } else {
        this.instance.setContent(content);
        this.instance.setProps({ placement });
      }

      if (enabled) {
        this.instance.enable();
      } else {
        this.instance.disable();
      }

      this.element.removeAttribute('title');
    });

    destroyRef.onDestroy(() => {
      this.destroyInstance();
    });
  }

  private destroyInstance(): void {
    const popper = this.instance?.popper;

    this.instance?.setProps({
      animation: false,
    });

    this.instance?.destroy();

    if (popper?.parentNode) {
      popper.parentNode.removeChild(popper);
    }

    this.instance = null;
  }
}
