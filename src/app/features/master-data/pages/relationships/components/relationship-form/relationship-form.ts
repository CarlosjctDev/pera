import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Icon } from '@app/core/components/icons/icon.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';
import { RelationshipTypeService } from '@app/features/master-data/services/relationship-type.service';

import type { RelationshipType } from '@app/features/master-data/models/relationship-type.model';

@Component({
  selector: 'app-relationship-form',
  imports: [FormsModule, Icon, T],
  templateUrl: './relationship-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipForm {
  private readonly relationshipTypeService = inject(RelationshipTypeService);
  private readonly toastr = inject(ToastrService);

  readonly saved = output<RelationshipType>();

  protected readonly name = signal('');
  protected readonly nameError = signal(false);
  protected readonly nameDuplicate = signal(false);
  protected readonly saving = signal(false);

  protected async add(): Promise<void> {
    const name = normalizeText(this.name());

    this.nameError.set(!name);
    this.nameDuplicate.set(false);

    if (this.nameError() || this.nameExists(name)) {
      this.nameDuplicate.set(this.nameExists(name));
      return;
    }

    this.saving.set(true);

    try {
      const relationshipType = await this.relationshipTypeService.create({ name });
      this.name.set('');
      this.saved.emit(relationshipType);
      this.toastr.success('toasts.saved');
    } catch {
      this.toastr.error('toasts.saveError');
    } finally {
      this.saving.set(false);
    }
  }

  private nameExists(name: string): boolean {
    const normalized = name.toLowerCase();

    return this.relationshipTypeService
      .relationshipTypes()
      .some((relationshipType) => relationshipType.name.trim().toLowerCase() === normalized);
  }
}
