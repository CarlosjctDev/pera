import { InjectionToken } from '@angular/core';

import type { NewNote, Note, NoteOwnerType } from '@app/features/notes/models/note.model';

export interface NoteOwner {
  readonly ownerType: NoteOwnerType;
  readonly ownerId: number;
}

export interface NoteRepository {
  list(): Promise<readonly Note[]>;
  add(newNote: NewNote): Promise<Note>;
  delete(id: number): Promise<void>;
  deleteByOwners(owners: readonly NoteOwner[]): Promise<void>;
}

export const NOTE_REPOSITORY = new InjectionToken<NoteRepository>('NOTE_REPOSITORY');
