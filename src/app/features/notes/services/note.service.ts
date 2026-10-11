import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataChangesService } from '@app/core/realtime/data-changes.service';
import { NOTE_REPOSITORY } from '@app/features/notes/data-access/note.repository';
import type { NoteOwner } from '@app/features/notes/data-access/note.repository';
import type { NewNote, Note, NoteOwnerType } from '@app/features/notes/models/note.model';

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  private readonly repository = inject(NOTE_REPOSITORY);
  private readonly dataChanges = inject(DataChangesService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _notes = signal<readonly Note[]>([]);
  private readonly _loading = signal(true);

  readonly notes = this._notes.asReadonly();
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

  async add(newNote: NewNote): Promise<Note> {
    const created = await this.repository.add(newNote);
    this._notes.set([...this._notes(), created]);
    return created;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
    this._notes.set(this._notes().filter((note) => note.id !== id));
  }

  async deleteByOwners(owners: readonly NoteOwner[]): Promise<void> {
    if (owners.length === 0) {
      return;
    }

    await this.repository.deleteByOwners(owners);
    this._notes.set(
      this._notes().filter(
        (note) =>
          !owners.some(
            (owner) => owner.ownerId === note.ownerId && owner.ownerType === note.ownerType,
          ),
      ),
    );
  }

  byOwner(ownerType: NoteOwnerType, ownerId: number): readonly Note[] {
    return this._notes()
      .filter((note) => note.ownerType === ownerType && note.ownerId === ownerId)
      .sort((a, b) => (a.date === b.date ? (b.id ?? 0) - (a.id ?? 0) : a.date < b.date ? 1 : -1));
  }

  private async reload(): Promise<void> {
    try {
      this._notes.set(await this.repository.list());
    } catch {
      /* keep previous data */
    }
  }
}
