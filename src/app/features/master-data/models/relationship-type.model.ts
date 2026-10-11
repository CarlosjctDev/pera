export interface RelationshipType {
  readonly id?: number;
  readonly name: string;
}

export type NewRelationshipType = Omit<RelationshipType, 'id'>;
