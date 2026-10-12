import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { RelationshipForm } from '@app/features/master-data/pages/relationships/components/relationship-form/relationship-form';

import type { RelationshipType } from '@app/features/master-data/models/relationship-type.model';

@Component({
  selector: 'app-relationship-form-dialog',
  imports: [DialogShellComponent, T, RelationshipForm],
  template: `
    <app-dialog-shell [title]="'relationships.submit' | t">
      <app-relationship-form (saved)="close($event)" />
    </app-dialog-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipFormDialogComponent {
  private readonly dialogRef = inject(DialogRef<RelationshipType | undefined>);

  protected close(relationshipType: RelationshipType): void {
    this.dialogRef.close(relationshipType);
  }
}
