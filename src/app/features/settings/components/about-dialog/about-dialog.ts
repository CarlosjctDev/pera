
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { EnvironmentService } from '@env/enviroment.service';
  

@Component({
  selector: 'app-about-dialog',
  imports: [DialogShellComponent, Icon, T],
  templateUrl: './about-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutDialogComponent {
  protected readonly environment = inject(EnvironmentService);
  private readonly dialogRef = inject(DialogRef<void>);

  protected readonly currentYear = new Date().getFullYear();

  protected close(): void {
    this.dialogRef.close();
  }
}
