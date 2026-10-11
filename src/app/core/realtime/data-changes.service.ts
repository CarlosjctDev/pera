import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Observable, Subject, debounceTime, share } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataChangesService {
  private readonly subject = new Subject<void>();

  readonly changed$: Observable<void>;

  constructor() {
    Dexie.on('storagemutated', () => this.subject.next());

    this.changed$ = this.subject.pipe(debounceTime(100), share());
  }
}
