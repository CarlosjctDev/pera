import type { ContactKind } from './contact-kind.model';

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';

export interface Contact {
  readonly id?: number;
  readonly name: string;
  readonly kind: ContactKind;
  readonly gender: Gender | null;
  readonly relationshipTypeId?: number;
  readonly isSelf?: boolean;
}

export type NewContact = Omit<Contact, 'id'>;
