import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '@app/core/components/icons/icon.component';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { T } from '@app/core/i18n/pipes/t.pipe';

@Component({
  selector: 'app-search-field',
  imports: [TippyDirective, Icon, T],
  template: `
    <div class="relative">
      <div
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-app-muted"
      >
        <app-icon name="search" class="h-4 w-4" />
      </div>
      <input
        type="search"
        [value]="value()"
        [placeholder]="placeholder() || ('common.search' | t)"
        [attr.aria-label]="placeholder() || ('common.search' | t)"
        (input)="onInput($event)"
        (keydown.enter)="onSubmit($event)"
        class="w-full rounded-xl border-0 bg-app-secondary py-2 pl-9 pr-8 text-sm text-app-fg placeholder:text-app-muted ring-1 ring-inset ring-app-border transition focus:ring-2 focus:ring-app-primary focus:outline-none"
      />
      @if (value()) {
        <button
          type="button"
          (click)="onClear()"
          [attr.aria-label]="'common.clearSearch' | t"
          [tippy]="'common.clearSearch' | t"
          class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-app-muted transition hover:text-app-fg"
        >
          <app-icon name="error" class="h-4 w-4" />
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchField {
  readonly value = input<string>('');
  readonly placeholder = input<string>('');

  readonly valueChange = output<string>();
  readonly submit = output<string>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  protected onSubmit(event: Event): void {
    this.submit.emit((event.target as HTMLInputElement).value);
  }

  protected onClear(): void {
    this.valueChange.emit('');
  }
}
