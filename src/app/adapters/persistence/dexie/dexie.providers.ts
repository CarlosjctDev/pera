import { Provider } from '@angular/core';

import { ACCOUNT_REPOSITORY } from '@app/features/transactions/data-access/account.repository';
import { ATTACHMENT_REPOSITORY } from '@app/features/attachments/data-access/attachment.repository';
import { DATA_BACKUPS } from '@app/core/data/data-backups';
import { DATA_STORE_BACKUP } from '@app/core/data/data-store-backup';
import { CONTACT_REPOSITORY } from '@app/features/master-data/data-access/contact.repository';
import { RELATIONSHIP_TYPE_REPOSITORY } from '@app/features/master-data/data-access/relationship-type.repository';
import { NOTE_REPOSITORY } from '@app/features/notes/data-access/note.repository';
import { PROFILE_REPOSITORY } from '@app/features/profile/data-access/profile.repository';
import { CATEGORY_REPOSITORY } from '@app/features/transactions/data-access/category.repository';
import { SCHEDULED_MOVEMENT_REPOSITORY } from '@app/features/transactions/data-access/scheduled-movement.repository';
import { TRANSACTION_REPOSITORY } from '@app/features/transactions/data-access/transaction.repository';

import { AppDatabase } from '@app/adapters/persistence/dexie/app.database';
import { AppBackupsDatabase, DexieDataBackups } from '@app/adapters/persistence/dexie/backups';
import { DexieAccountRepository } from '@app/adapters/persistence/dexie/repositories/account';
import { DexieAttachmentRepository } from '@app/adapters/persistence/dexie/repositories/attachment';
import { DexieCategoryRepository } from '@app/adapters/persistence/dexie/repositories/category';
import { DexieContactRepository } from '@app/adapters/persistence/dexie/repositories/contact';
import { DexieNoteRepository } from '@app/adapters/persistence/dexie/repositories/note';
import { DexieProfileRepository } from '@app/adapters/persistence/dexie/repositories/profile';
import { DexieRelationshipTypeRepository } from '@app/adapters/persistence/dexie/repositories/relationship-type';
import { DexieScheduledMovementRepository } from '@app/adapters/persistence/dexie/repositories/scheduled-movement';
import { DexieStoreBackup } from '@app/adapters/persistence/dexie/store-backup';
import { DexieTransactionRepository } from '@app/adapters/persistence/dexie/repositories/transaction';

export const PROVIDERS: Provider[] = [
  AppDatabase,
  AppBackupsDatabase,
  {
    provide: DATA_STORE_BACKUP,
    useClass: DexieStoreBackup,
  },
  {
    provide: DATA_BACKUPS,
    useClass: DexieDataBackups,
  },
  {
    provide: PROFILE_REPOSITORY,
    useClass: DexieProfileRepository,
  },
  {
    provide: CATEGORY_REPOSITORY,
    useClass: DexieCategoryRepository,
  },
  {
    provide: TRANSACTION_REPOSITORY,
    useClass: DexieTransactionRepository,
  },
  {
    provide: CONTACT_REPOSITORY,
    useClass: DexieContactRepository,
  },
  {
    provide: RELATIONSHIP_TYPE_REPOSITORY,
    useClass: DexieRelationshipTypeRepository,
  },
  {
    provide: ACCOUNT_REPOSITORY,
    useClass: DexieAccountRepository,
  },
  {
    provide: SCHEDULED_MOVEMENT_REPOSITORY,
    useClass: DexieScheduledMovementRepository,
  },
  {
    provide: ATTACHMENT_REPOSITORY,
    useClass: DexieAttachmentRepository,
  },
  {
    provide: NOTE_REPOSITORY,
    useClass: DexieNoteRepository,
  },
];
