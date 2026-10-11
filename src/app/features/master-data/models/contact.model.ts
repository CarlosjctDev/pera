export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';

export interface Contact {
  readonly id?: number;
  readonly name: string;
  readonly isCompany: boolean;
  readonly gender: Gender | null;
  readonly relationshipTypeId?: number;
}

export type NewContact = Omit<Contact, 'id'>;
