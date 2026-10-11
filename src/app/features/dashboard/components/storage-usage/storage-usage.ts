import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Icon } from '@app/core/components/icons/icon.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { Bytes } from '@app/core/i18n/pipes/bytes.pipe';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { StorageService } from '@app/core/storage/storage.service';

@Component({
  selector: 'app-storage-usage',
  imports: [Icon, T, Bytes],
  templateUrl: './storage-usage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageUsage {
  protected readonly storage = inject(StorageService);

  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);

  async ngOnInit(): Promise<void> {
    await this.storage.init();

    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.storage.refresh());
  }

  protected async requestPersistence(): Promise<void> {
    console.log('requestPersistence', this.storage.persisted(), this.storage.canPersist());
    if (this.storage.persisted()) {
      this.toastr.warning('dashboard.storage.alreadyPersistent');
      return;
    }

    if (!this.storage.canPersist()) {
      this.toastr.error('dashboard.storage.secureContextRequired');
      return;
    }

    const result = await this.storage.requestPersistence();
    await this.storage.refresh();

    if (result === 'persisted') {
      this.toastr.warning('dashboard.storage.alreadyPersistent');
    } else if (result === 'granted') {
      this.toastr.success('dashboard.storage.persistSuccess');
    } else {      
      this.toastr.error('dashboard.storage.persistError');
    }
  }
}
