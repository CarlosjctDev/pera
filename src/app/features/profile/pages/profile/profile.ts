import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';

import { T } from '@app/core/i18n/pipes/t.pipe';
import { Icon } from '@app/core/components/icons/icon.component';
import { LanguageComponent } from '@app/core/components/language/language.component';
import { SelectComponent } from '@app/core/components/select/select.component';
import { ThemeComponent } from '@app/core/components/theme/theme.component';
import { I18nService } from '@app/core/i18n/i18n.service';
import { APP_ROUTES } from '@app/core/routing/app.routing';
import { normalizeText } from '@app/core/utils/text.utils';
import { CURRENCIES, DEFAULT_CURRENCY } from '@app/features/profile/models/currency.model';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { BackupsDialogComponent } from '@app/features/settings/components/backups-dialog/backups-dialog';
import { ImportSourceDialogComponent } from '@app/features/settings/components/import-source-dialog/import-source-dialog';
import { SettingsService } from '@app/features/settings/services/settings.service';

import type { CurrencyCode } from '@app/features/profile/models/currency.model';
import type { ImportSource } from '@app/features/settings/components/import-source-dialog/import-source-dialog';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, T, LanguageComponent, SelectComponent, ThemeComponent, Icon],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(Dialog);
  private readonly profile = inject(ProfileService);
  private readonly settingsService = inject(SettingsService);
  private readonly i18n = inject(I18nService);

  protected readonly importInput =
    viewChild.required<ElementRef<HTMLInputElement>>('importInput');

  protected readonly isWelcome =
    this.route.snapshot.routeConfig?.path === APP_ROUTES.welcome.path;

  protected readonly maxNameLength = 50;
  protected readonly currencies = CURRENCIES;

  protected readonly currencyOptions = computed(() =>
    this.currencies.map((option) => ({
      value: option.code,
      label: `${option.symbol} — ${this.i18n.t(option.labelKey)}`,
    })),
  );
  protected readonly name = signal('');
  protected readonly currency = signal<CurrencyCode>(DEFAULT_CURRENCY);
  protected readonly error = signal(false);
  protected readonly saving = signal(false);

  ngOnInit(): void {
    this.name.set(this.profile.name());
    this.currency.set(this.profile.currency());
  }

  protected async continue(): Promise<void> {
    const name = normalizeText(this.name());

    if (!name) {
      this.error.set(true);
      return;
    }

    if (name.length > this.maxNameLength) {
      this.error.set(true);
      return;
    }

    this.error.set(false);
    this.saving.set(true);

    try {
      await this.profile.complete(name, this.currency());
      await this.router.navigate(['/' + APP_ROUTES.dashboard.path]);
    } catch {
      this.saving.set(false);
      this.error.set(true);
    }
  }

  protected onImport(): void {
    const sourceRef = this.dialog.open<ImportSource>(ImportSourceDialogComponent);

    sourceRef.closed.subscribe((source) => {
      if (source === 'file') {
        this.importInput().nativeElement.click();
      } else if (source === 'backup') {
        this.openBackups();
      }
    });
  }

  protected async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    input.value = '';

    const imported = await this.settingsService.importFromFile(file);

    if (imported) {
      await this.router.navigate(['/' + APP_ROUTES.dashboard.path]);
    }
  }

  private openBackups(): void {
    const dialogRef = this.dialog.open<boolean>(BackupsDialogComponent, {
      data: { allowSave: false },
    });

    dialogRef.closed.subscribe((restored) => {
      if (restored) {
        void this.router.navigate(['/' + APP_ROUTES.dashboard.path]);
      }
    });
  }
}
