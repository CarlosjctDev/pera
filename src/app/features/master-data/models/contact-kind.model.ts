export type ContactKind = 'person' | 'company' | 'pet';

export function canIncludeSelfContact(kind: ContactKind | null): boolean {
	return kind === 'person';
}
