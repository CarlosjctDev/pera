import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

import { DialogShellComponent } from '@app/core/components/dialog/dialog-shell.component';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { CategoryForm } from '@app/features/master-data/pages/categories/components/category-form/category-form';

import type { Category } from '@app/features/transactions/models/category.model';

@Component({
  selector: 'app-category-form-dialog',
  imports: [DialogShellComponent, T, CategoryForm],
  template: `
    <app-dialog-shell [title]="'categories.submit' | t">
      <app-category-form (saved)="close($event)" />
    </app-dialog-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormDialogComponent {
  private readonly dialogRef = inject(DialogRef<Category | undefined>);

  protected close(category: Category): void {
    this.dialogRef.close(category);
  }
}
