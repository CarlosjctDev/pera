export type NoteOwnerType = 'transaction' | 'account';

export const NOTE_OWNER_TYPES = ['transaction', 'account'] as const;

export const NOTE_MAX_LENGTH = 500;

export interface Note {
  readonly id?: number;
  readonly ownerType: NoteOwnerType;
  readonly ownerId: number;
  readonly date: string;
  readonly text: string;
}

export type NewNote = Omit<Note, 'id'>;
