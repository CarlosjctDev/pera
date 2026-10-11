import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { RELATIONSHIP_TYPE_REPOSITORY } from '@app/features/master-data/data-access/relationship-type.repository';

import type {
  NewRelationshipType,
  RelationshipType,
} from '@app/features/master-data/models/relationship-type.model';

@Injectable({
  providedIn: 'root',
})
export class RelationshipTypeService {
  private readonly repository = inject(RELATIONSHIP_TYPE_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _relationshipTypes = signal<readonly RelationshipType[]>([]);
  private readonly _loading = signal(true);

  readonly relationshipTypes = this._relationshipTypes.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.dataChanges.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.reload());
  }

  async load(): Promise<void> {
    await this.reload();
    this._loading.set(false);
  }

  private async reload(): Promise<void> {
    try {
      this._relationshipTypes.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }

  async create(newRelationshipType: NewRelationshipType): Promise<RelationshipType> {
    const relationshipType = await this.repository.add(newRelationshipType);
    this._relationshipTypes.set([...this._relationshipTypes(), relationshipType]);
    return relationshipType;
  }

  async update(relationshipType: RelationshipType): Promise<void> {
    await this.repository.update(relationshipType);
    this._relationshipTypes.set(
      this._relationshipTypes().map((current) =>
        current.id === relationshipType.id ? relationshipType : current,
      ),
    );
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
    this._relationshipTypes.set(
      this._relationshipTypes().filter((relationshipType) => relationshipType.id !== id),
    );
  }
}
