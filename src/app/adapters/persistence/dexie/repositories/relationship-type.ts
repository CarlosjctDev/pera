import { Injectable, inject } from '@angular/core';

import type { RelationshipTypeRepository } from '@app/features/master-data/data-access/relationship-type.repository';

import type {
  NewRelationshipType,
  RelationshipType,
} from '@app/features/master-data/models/relationship-type.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';

@Injectable()
export class DexieRelationshipTypeRepository implements RelationshipTypeRepository {
  private readonly db = inject(AppDatabase);

  async list(): Promise<readonly RelationshipType[]> {
    return this.db.relationshipTypes.reverse().toArray();
  }

  async add(newRelationshipType: NewRelationshipType): Promise<RelationshipType> {
    const id = await this.db.relationshipTypes.add(newRelationshipType);

    return { ...newRelationshipType, id };
  }

  async update(relationshipType: RelationshipType): Promise<RelationshipType> {
    await this.db.relationshipTypes.put(relationshipType);

    return relationshipType;
  }

  async delete(id: number): Promise<void> {
    await this.db.transaction('rw', this.db.relationshipTypes, this.db.contacts, async () => {
      await this.db.contacts
        .where('relationshipTypeId')
        .equals(id)
        .modify({ relationshipTypeId: undefined });
      await this.db.relationshipTypes.delete(id);
    });
  }
}
