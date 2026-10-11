import { InjectionToken } from '@angular/core';

import type {
  NewRelationshipType,
  RelationshipType,
} from '@app/features/master-data/models/relationship-type.model';

export interface RelationshipTypeRepository {
  list(): Promise<readonly RelationshipType[]>;
  add(newRelationshipType: NewRelationshipType): Promise<RelationshipType>;
  update(relationshipType: RelationshipType): Promise<RelationshipType>;
  delete(id: number): Promise<void>;
}

export const RELATIONSHIP_TYPE_REPOSITORY = new InjectionToken<RelationshipTypeRepository>(
  'RELATIONSHIP_TYPE_REPOSITORY',
);
