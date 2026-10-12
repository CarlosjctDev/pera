import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';

import { CategoryFormDialogComponent } from '@app/features/master-data/pages/categories/components/category-form-dialog/category-form-dialog';
import { ContactFormDialogComponent } from '@app/features/master-data/pages/contacts/components/contact-form-dialog/contact-form-dialog';
import { RelationshipFormDialogComponent } from '@app/features/master-data/pages/relationships/components/relationship-form-dialog/relationship-form-dialog';

import type { RelationshipType } from '@app/features/master-data/models/relationship-type.model';
import type { ContactKind } from '@app/features/master-data/models/contact-kind.model';
import type { Contact } from '@app/features/master-data/models/contact.model';
import type { Category } from '@app/features/transactions/models/category.model';

import type { ContactFormDialogData } from '@app/features/master-data/pages/contacts/components/contact-form-dialog/contact-form-dialog';

@Injectable({
  providedIn: 'root',
})
export class MasterDataDialogsService {
  private readonly dialog = inject(Dialog);

  addCategory(): Promise<Category | undefined> {
    const ref = this.dialog.open<Category | undefined>(CategoryFormDialogComponent);
    return firstValueFrom(ref.closed);
  }

  addRelationshipType(): Promise<RelationshipType | undefined> {
    const ref = this.dialog.open<RelationshipType | undefined>(RelationshipFormDialogComponent);
    return firstValueFrom(ref.closed);
  }

  addContact(kind: ContactKind): Promise<Contact | undefined> {
    const ref = this.dialog.open<Contact | undefined, ContactFormDialogData>(
      ContactFormDialogComponent,
      { data: { kind } },
    );
    return firstValueFrom(ref.closed);
  }
}
