import { Injectable, inject } from '@angular/core';

import type { NoteOwner, NoteRepository } from '@app/features/notes/data-access/note.repository';
import type { NewNote, Note } from '@app/features/notes/models/note.model';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';

@Injectable()
export class DexieNoteRepository implements NoteRepository {
  private readonly db = inject(AppDatabase);

  async list(): Promise<readonly Note[]> {
    return this.db.notes.toArray();
  }

  async add(newNote: NewNote): Promise<Note> {
    const id = await this.db.notes.add(newNote);

    return { ...newNote, id };
  }

  async delete(id: number): Promise<void> {
    await this.db.notes.delete(id);
  }

  async deleteByOwners(owners: readonly NoteOwner[]): Promise<void> {
    if (owners.length === 0) {
      return;
    }

    const ownerKeys = new Set(owners.map(({ ownerType, ownerId }) => `${ownerType}:${ownerId}`));

    await this.db.notes
      .filter((note) => ownerKeys.has(`${note.ownerType}:${note.ownerId}`))
      .delete();
  }
}
