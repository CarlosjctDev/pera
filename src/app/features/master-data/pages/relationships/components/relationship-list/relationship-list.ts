import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import type { TemplateRef } from '@angular/core';

import { ConfirmDialogComponent } from '@app/core/components/dialog/confirm-dialog.component';
import { Icon } from '@app/core/components/icons/icon.component';
import { ToastrService } from '@app/core/components/toastr/toastr';
import { DataTable } from '@app/core/components/table/data-table';
import type { DataColumn } from '@app/core/components/table/data-table.model';
import { TippyDirective } from '@app/core/directives/tippy.directive';
import { I18nService } from '@app/core/i18n/i18n.service';
import { T } from '@app/core/i18n/pipes/t.pipe';
import { normalizeText } from '@app/core/utils/text.utils';
import { ContactService } from '@app/features/master-data/services/contact.service';
import { RelationshipTypeService } from '@app/features/master-data/services/relationship-type.service';

import type { RelationshipType } from '@app/features/master-data/models/relationship-type.model';

@Component({
  selector: 'app-relationship-list',
  imports: [FormsModule, Icon, T, TippyDirective, DataTable],
  templateUrl: './relationship-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipList {
  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly contactService = inject(ContactService);
  private readonly relationshipTypeService = inject(RelationshipTypeService);
  private readonly toastr = inject(ToastrService);

  protected readonly relationshipTypes = this.relationshipTypeService.relationshipTypes;
  protected readonly loading = this.relationshipTypeService.loading;

  protected readonly inUse = computed(() => {
    const ids: number[] = [];

    for (const contact of this.contactService.contacts()) {
      if (contact.relationshipTypeId !== undefined) {
        ids.push(contact.relationshipTypeId);
      }
    }

    return new Set(ids);
  });

  private readonly nameCell = viewChild<TemplateRef<unknown>>('nameCell');
  private readonly actionsCell = viewChild<TemplateRef<unknown>>('actionsCell');
  protected readonly editRow = viewChild<TemplateRef<unknown>>('editCell');

  protected readonly columns = computed<readonly DataColumn<RelationshipType>[]>(() => {
    const nameCell = this.nameCell();
    const actionsCell = this.actionsCell();

    if (nameCell === undefined || actionsCell === undefined) {
      return [];
    }

    return [
      {
        key: 'name',
        labelKey: 'relationships.name',
        searchable: true,
        sortable: true,
        cellTemplate: nameCell,
      },
      {
        key: 'actions',
        labelKey: 'common.actions',
        align: 'right',
        widthClass: 'w-20',
        cellTemplate: actionsCell,
      },
    ];
  });

  protected readonly editingId = signal<number | null>(null);
  protected readonly editName = signal('');
  protected readonly editDuplicate = signal(false);

  protected startEdit(relationshipType: RelationshipType): void {
    if (relationshipType.id === undefined) {
      return;
    }

    this.editingId.set(relationshipType.id);
    this.editName.set(relationshipType.name);
    this.editDuplicate.set(false);
  }

  protected async saveEdit(relationshipType: RelationshipType): Promise<void> {
    const name = normalizeText(this.editName());

    if (!name) {
      this.cancelEdit();
      return;
    }

    if (this.nameExists(name, relationshipType.id)) {
      this.editDuplicate.set(true);
      return;
    }

    if (relationshipType.id === undefined) {
      this.cancelEdit();
      return;
    }

    await this.relationshipTypeService.update({ id: relationshipType.id, name });
    this.cancelEdit();
    this.toastr.success('toasts.updated');
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editName.set('');
    this.editDuplicate.set(false);
  }

  protected readonly isEditing = (relationshipType: RelationshipType): boolean =>
    relationshipType.id !== undefined && this.editingId() === relationshipType.id;

  protected confirmDelete(relationshipType: RelationshipType): void {
    if (relationshipType.id === undefined || this.isInUse(relationshipType.id)) {
      return;
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('relationships.deleteConfirmTitle'),
        message: this.i18n.t('relationships.deleteConfirmMessage'),
        confirmLabel: this.i18n.t('common.confirm'),
        cancelLabel: this.i18n.t('common.cancel'),
        variant: 'danger',
      },
    });

    dialogRef.closed.subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      try {
        await this.relationshipTypeService.remove(relationshipType.id as number);
        await this.contactService.load();
        this.toastr.success('toasts.deleted');
      } catch {
        this.toastr.error('toasts.deleteError');
      }
    });
  }

  protected isInUse(id: number | undefined): boolean {
    return id === undefined ? false : this.inUse().has(id);
  }

  private nameExists(name: string, excludeId?: number): boolean {
    const normalized = name.toLowerCase();

    return this.relationshipTypes().some(
      (relationshipType) =>
        relationshipType.id !== excludeId &&
        relationshipType.name.trim().toLowerCase() === normalized,
    );
  }
}
