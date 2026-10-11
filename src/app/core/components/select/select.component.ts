import { OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Icon } from '@app/core/components/icons/icon.component';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';

import type { ConnectedPosition } from '@angular/cdk/overlay';

export type SelectValue = string | number | null;

export interface SelectOption {
  readonly value: SelectValue;
  readonly label: string;
}

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

@Component({
  selector: 'app-select',
  imports: [Icon, OverlayModule, T],
  templateUrl: './select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  host: { class: 'block' },
})
export class SelectComponent implements ControlValueAccessor {
  private static nextId = 0;

  readonly options = input<readonly SelectOption[]>([]);
  readonly placeholder = input('');
  readonly searchable = input(true);
  readonly size = input<'sm' | 'md'>('md');
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly id = input('');

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly selectedValue = signal<SelectValue>(null);
  protected readonly triggerWidth = signal(0);
  protected readonly positions = POSITIONS;
  protected readonly listboxId = `app-select-listbox-${SelectComponent.nextId++}`;

  private readonly cvaDisabled = signal(false);
  private focusSearchOnOpen = true;

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly selectedLabel = computed(() => {
    const value = this.selectedValue();

    return this.options().find((option) => option.value === value)?.label ?? '';
  });

  protected readonly filteredOptions = computed(() => {
    const query = normalizeText(this.query()).toLowerCase();

    if (!query) {
      return this.options();
    }

    return this.options().filter((option) =>
      normalizeText(option.label).toLowerCase().includes(query),
    );
  });

  private readonly trigger = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  private notifyChange: (value: SelectValue) => void = () => {};
  private notifyTouched: () => void = () => {};

  writeValue(value: SelectValue): void {
    this.selectedValue.set(value ?? null);
  }

  registerOnChange(fn: (value: SelectValue) => void): void {
    this.notifyChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  protected onPointerDown(event: PointerEvent): void {
    this.focusSearchOnOpen = event.pointerType !== 'touch';
  }

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.open()) {
      this.close();
    } else {
      this.openPanel(this.focusSearchOnOpen);
    }

    this.focusSearchOnOpen = true;
  }

  protected openPanel(focusSearch = true): void {
    if (this.isDisabled()) {
      return;
    }

    this.query.set('');
    this.activeIndex.set(
      Math.max(
        0,
        this.options().findIndex((option) => option.value === this.selectedValue()),
      ),
    );
    this.triggerWidth.set(this.trigger()?.nativeElement.offsetWidth ?? 0);
    this.open.set(true);

    queueMicrotask(() => {
      if (this.open() && this.searchable() && focusSearch) {
        this.searchInput()?.nativeElement.focus();
      }
    });
  }

  protected close(restoreFocus = false): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    this.notifyTouched();

    if (restoreFocus) {
      queueMicrotask(() => this.trigger()?.nativeElement.focus());
    }
  }

  protected select(option: SelectOption): void {
    if (this.isDisabled()) {
      return;
    }

    if (option.value === this.selectedValue()) {
      this.close(true);
      return;
    }

    this.selectedValue.set(option.value);
    this.notifyChange(option.value);
    this.close(true);
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onSearchInput(event: Event): void {
    this.onQueryChange((event.target as HTMLInputElement).value);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.open()) {
      this.onPanelKeydown(event);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.openPanel();
    }
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    this.onPanelKeydown(event);
  }

  private onPanelKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((index) =>
          options.length ? Math.min(index + 1, options.length - 1) : 0,
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((index) => (options.length ? Math.max(index - 1, 0) : 0));
        break;

      case 'Home':
        if (options.length) {
          event.preventDefault();
          this.activeIndex.set(0);
        }
        break;

      case 'End':
        if (options.length) {
          event.preventDefault();
          this.activeIndex.set(options.length - 1);
        }
        break;

      case 'Enter': {
        event.preventDefault();
        const option = options[this.activeIndex()];
        if (option) {
          this.select(option);
        }
        break;
      }

      case ' ':
        if (!this.searchable()) {
          event.preventDefault();
          const option = options[this.activeIndex()];
          if (option) {
            this.select(option);
          }
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected triggerClasses(): string {
    return [
      'flex w-full items-center justify-between gap-2 rounded-xl bg-app-secondary/50 text-app-fg',
      'ring-1 ring-inset ring-app-border transition',
      'focus:outline-none focus:ring-2 focus:ring-app-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      this.size() === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm',
    ].join(' ');
  }

  protected optionClasses(option: SelectOption, index: number): string {
    return [
      'flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 transition',
      index === this.activeIndex() ? 'bg-app-secondary-hover text-app-fg' : 'text-app-fg',
      option.value === this.selectedValue() ? 'font-semibold text-app-primary' : '',
    ].join(' ');
  }
}