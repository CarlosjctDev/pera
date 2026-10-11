import { isCurrency } from '@app/features/profile/models/currency.model';

import type { CurrencyCode } from '@app/features/profile/models/currency.model';
import { environment } from '@env/environment';

export const STORE_SNAPSHOT_APP = environment.appName;
export const STORE_SCHEMA_VERSION = 7;

const BASE_SNAPSHOT_TABLES = [
  'profiles',
  'categories',
  'transactions',
  'relationshipTypes',
  'contacts',
  'accounts',
] as const;

const V5_SNAPSHOT_TABLES = [
  ...BASE_SNAPSHOT_TABLES,
  'scheduledMovements',
  'attachments',
] as const;

const ALL_SNAPSHOT_TABLES = [...V5_SNAPSHOT_TABLES, 'notes'] as const;

const SNAPSHOT_TABLES_BY_VERSION: Readonly<Record<number, readonly string[]>> = {
  1: ['profiles'],
  2: ['profiles', 'categories', 'transactions'],
  3: ['profiles', 'categories', 'transactions', 'relationshipTypes', 'contacts'],
  4: BASE_SNAPSHOT_TABLES as readonly string[],
  5: V5_SNAPSHOT_TABLES as readonly string[],
  6: V5_SNAPSHOT_TABLES as readonly string[],
  7: ALL_SNAPSHOT_TABLES as readonly string[],
};

const TRANSACTION_TYPES = ['income', 'expense', 'saving', 'investment', 'transfer'] as const;
const ACCOUNT_TYPES = ['receivable', 'payable'] as const;
const ACCOUNT_STATUSES = ['pending', 'paid'] as const;
const ATTACHMENT_OWNER_TYPES = ['transaction', 'account'] as const;
const RECURRENCE_KINDS = ['none', 'days', 'weeks', 'months', 'years'] as const;
const GENDERS = ['male', 'female', 'non_binary', 'prefer_not_to_say', 'other'] as const;

export interface ProfileSnapshot {
  readonly id: number;
  readonly name: string;
  readonly currency: CurrencyCode;
  readonly createdAt: string;
}

export interface CategorySnapshot {
  readonly id: number;
  readonly name: string;
  readonly type?: (typeof TRANSACTION_TYPES)[number];
}

export interface TransactionSnapshot {
  readonly id: number;
  readonly type: (typeof TRANSACTION_TYPES)[number];
  readonly categoryId: number;
  readonly contactId?: number;
  readonly date: string;
  readonly concept: string;
  readonly amount: number;
  readonly scheduledId?: number;
  readonly accountId?: number;
}

export interface RelationshipTypeSnapshot {
  readonly id: number;
  readonly name: string;
}

export interface ContactSnapshot {
  readonly id: number;
  readonly name: string;
  readonly isCompany: boolean;
  readonly gender: (typeof GENDERS)[number] | null;
  readonly relationshipTypeId?: number;
}

export interface AccountSnapshot {
  readonly id: number;
  readonly type: (typeof ACCOUNT_TYPES)[number];
  readonly categoryId?: number;
  readonly contactId: number;
  readonly concept: string;
  readonly amount: number;
  readonly dueDate?: string;
  readonly status: (typeof ACCOUNT_STATUSES)[number];
}

export interface ScheduledMovementSnapshot {
  readonly id: number;
  readonly type: (typeof TRANSACTION_TYPES)[number];
  readonly accountType?: (typeof ACCOUNT_TYPES)[number];
  readonly categoryId: number;
  readonly contactId?: number;
  readonly concept: string;
  readonly amount: number;
  readonly startDate: string;
  readonly recurrence?: {
    readonly kind: (typeof RECURRENCE_KINDS)[number];
    readonly every?: number | null;
    readonly dayOfMonth?: number | null;
    readonly month?: number | null;
    readonly omitWeekdays?: readonly number[];
  };
  readonly nextDate: string;
  readonly active: boolean;
}

export interface AttachmentSnapshot {
  readonly id: number;
  readonly ownerType: (typeof ATTACHMENT_OWNER_TYPES)[number];
  readonly ownerId: number;
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  readonly data: string;
}

export interface NoteSnapshot {
  readonly id: number;
  readonly ownerType: (typeof ATTACHMENT_OWNER_TYPES)[number];
  readonly ownerId: number;
  readonly date: string;
  readonly text: string;
}

export interface StoreSnapshot {
  readonly app: typeof STORE_SNAPSHOT_APP;
  readonly version: number;
  readonly exportedAt: string;
  readonly profileName?: string;
  readonly tables: {
    readonly profiles: readonly ProfileSnapshot[];
    readonly categories: readonly CategorySnapshot[];
    readonly transactions: readonly TransactionSnapshot[];
    readonly relationshipTypes: readonly RelationshipTypeSnapshot[];
    readonly contacts: readonly ContactSnapshot[];
    readonly accounts: readonly AccountSnapshot[];
    readonly scheduledMovements: readonly ScheduledMovementSnapshot[];
    readonly attachments: readonly AttachmentSnapshot[];
    readonly notes: readonly NoteSnapshot[];
  };
}

export type SnapshotProblemCode =
  | 'invalidFormat'
  | 'notAppBackup'
  | 'unsupportedVersion'
  | 'invalidExportedAt'
  | 'invalidProfileName'
  | 'tableNotArray'
  | 'duplicateId'
  | 'multipleProfiles'
  | 'invalidRow'
  | 'invalidId'
  | 'invalidName'
  | 'invalidType'
  | 'invalidCategory'
  | 'invalidContact'
  | 'invalidDate'
  | 'invalidConcept'
  | 'invalidAmount'
  | 'invalidAccountType'
  | 'invalidDueDate'
  | 'invalidStatus'
  | 'invalidRecurrence'
  | 'invalidStartDate'
  | 'invalidNextDate'
  | 'invalidActive'
  | 'invalidIsCompany'
  | 'invalidGender'
  | 'invalidRelationshipType'
  | 'invalidCurrency'
  | 'invalidCreatedAt'
  | 'invalidOwnerType'
  | 'invalidOwnerId'
  | 'invalidMimeType'
  | 'invalidSize'
  | 'invalidBase64'
  | 'invalidText'
  | 'missingCategoryReference'
  | 'missingContactReference'
  | 'missingRelationshipReference';

export interface SnapshotProblem {
  readonly code: SnapshotProblemCode;
  readonly table?: string;
  readonly index?: number;
  readonly id?: number;
  readonly current?: string;
  readonly expected?: string;
  readonly appName?: string;
}

export class StoreSnapshotError extends Error {
  readonly problems: readonly SnapshotProblem[];

  constructor(problems: readonly SnapshotProblem[]) {
    super(problems[0]?.code ?? 'Invalid snapshot');
    this.name = 'StoreSnapshotError';
    this.problems = problems;
  }
}

type Row = Record<string, unknown>;

const isRecord = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

const isOptionalString = (value: unknown): boolean =>
  value === undefined || value === null || typeof value === 'string';

const isPosInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isNullablePosInteger = (value: unknown): boolean =>
  value === undefined || value === null || isPosInteger(value);

const oneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === 'string' && (values as readonly string[]).includes(value);

type ProblemInit = Omit<SnapshotProblem, 'code'>;

const problem = (code: SnapshotProblemCode, init: ProblemInit = {}): SnapshotProblem => ({
  code,
  ...init,
});

interface RowValidator {
  readonly check: (row: Row) => SnapshotProblemCode | null;
}

const recurrenceValidator: RowValidator = {
  check: (row) => {
    if (row['recurrence'] === undefined) {
      return null;
    }

    const recurrence = row['recurrence'];

    if (!isRecord(recurrence)) {
      return 'invalidRecurrence';
    }

    if (!oneOf(RECURRENCE_KINDS)(recurrence['kind'])) {
      return 'invalidRecurrence';
    }

    if (
      !isNullablePosInteger(recurrence['every']) ||
      !isNullablePosInteger(recurrence['dayOfMonth'])
    ) {
      return 'invalidRecurrence';
    }

    if (!isNullablePosInteger(recurrence['month'])) {
      return 'invalidRecurrence';
    }

    if (
      recurrence['omitWeekdays'] !== undefined &&
      (!Array.isArray(recurrence['omitWeekdays']) ||
        !recurrence['omitWeekdays'].every(
          (day) => typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6,
        ))
    ) {
      return 'invalidRecurrence';
    }

    return null;
  },
};

function validateTable(
  problems: SnapshotProblem[],
  table: string,
  section: unknown,
  validators: readonly RowValidator[],
): readonly Row[] {
  if (!Array.isArray(section)) {
    problems.push(problem('tableNotArray', { table }));
    return [];
  }

  section.forEach((row, index) => {
    if (!isRecord(row)) {
      problems.push(problem('invalidRow', { table, index }));
      return;
    }

    for (const validator of validators) {
      const code = validator.check(row);

      if (code !== null) {
        problems.push(problem(code, { table, index }));
      }
    }
  });

  return section;
}

function pushDuplicateIds(problems: SnapshotProblem[], table: string, rows: readonly Row[]): void {
  const seen = new Set<number>();

  for (const row of rows) {
    if (isPosInteger(row['id'])) {
      if (seen.has(row['id'])) {
        problems.push(problem('duplicateId', { table, id: row['id'] }));
      }
      seen.add(row['id']);
    }
  }
}

function normalizeConcepts(rows: readonly Row[]): void {
  for (const row of rows) {
    if (row['concept'] === undefined || row['concept'] === null) {
      row['concept'] = '';
    }
  }
}

function positiveIds(rows: readonly Row[]): Set<number> {
  const ids = new Set<number>();

  for (const row of rows) {
    if (isPosInteger(row['id'])) {
      ids.add(row['id']);
    }
  }

  return ids;
}

export function parseStoreSnapshot(raw: unknown): StoreSnapshot {
  const problems: SnapshotProblem[] = [];

  if (!isRecord(raw)) {
    throw new StoreSnapshotError([problem('invalidFormat')]);
  }

  if (raw['app'] !== STORE_SNAPSHOT_APP) {
    problems.push(problem('notAppBackup',{
      appName: STORE_SNAPSHOT_APP
    }));
  }

  if (
    !Number.isInteger(raw['version']) ||
    (raw['version'] as number) < 1 ||
    (raw['version'] as number) > STORE_SCHEMA_VERSION
  ) {
    problems.push(
      problem('unsupportedVersion', {
        current: String(raw['version']),
        expected: String(STORE_SCHEMA_VERSION),
      }),
    );
  }

  if (!isIsoDate(raw['exportedAt'])) {
    problems.push(problem('invalidExportedAt'));
  }

  if (raw['profileName'] !== undefined && typeof raw['profileName'] !== 'string') {
    problems.push(problem('invalidProfileName'));
  }

  const tables: Row = { ...(isRecord(raw['tables']) ? raw['tables'] : {}) };

  const tablesInVersion = Number.isInteger(raw['version'])
    ? (SNAPSHOT_TABLES_BY_VERSION[raw['version'] as number] ?? [])
    : [];

  for (const table of ALL_SNAPSHOT_TABLES) {
    if (table in tables || tablesInVersion.includes(table)) {
      continue;
    }

    tables[table] = [];
  }

  const categories = validateTable(problems, 'categories', tables['categories'], [
    { check: (row) => (isPosInteger(row['id']) ? null : 'invalidId') },
    { check: (row) => (isNonEmptyString(row['name']) ? null : 'invalidName') },
    {
      check: (row) =>
        row['type'] === undefined || oneOf(TRANSACTION_TYPES)(row['type']) ? null : 'invalidType',
    },
  ]);
  pushDuplicateIds(problems, 'categories', categories);

  const relationshipTypes = validateTable(
    problems,
    'relationshipTypes',
    tables['relationshipTypes'],
    [
      { check: (row) => (isPosInteger(row['id']) ? null : 'invalidId') },
      { check: (row) => (isNonEmptyString(row['name']) ? null : 'invalidName') },
    ],
  );
  pushDuplicateIds(problems, 'relationshipTypes', relationshipTypes);

  const contacts = validateTable(problems, 'contacts', tables['contacts'], [
    { check: (row) => (isPosInteger(row['id']) ? null : 'invalidId') },
    { check: (row) => (isNonEmptyString(row['name']) ? null : 'invalidName') },
    { check: (row) => (typeof row['isCompany'] === 'boolean' ? null : 'invalidIsCompany') },
    {
      check: (row) =>
        row['gender'] === null || oneOf(GENDERS)(row['gender']) ? null : 'invalidGender',
    },
    {
      check: (row) =>
        row['relationshipTypeId'] === undefined || isPosInteger(row['relationshipTypeId'])
          ? null
          : 'invalidRelationshipType',
    },
  ]);
  pushDuplicateIds(problems, 'contacts', contacts);

  const transactions = validateTable(problems, 'transactions', tables['transactions'], [
    { check: (row) => (isPosInteger(row['id']) ? null : 'invalidId') },
    { check: (row) => (oneOf(TRANSACTION_TYPES)(row['type']) ? null : 'invalidType') },
    { check: (row) => (isPosInteger(row['categoryId']) ? null : 'invalidCategory') },
    {
      check: (row) =>
        row['contactId'] === undefined || isPosInteger(row['contactId']) ? null : 'invalidContact',
    },
    { check: (row) => (isIsoDate(row['date']) ? null : 'invalidDate') },
    { check: (row) => (isOptionalString(row['concept']) ? null : 'invalidConcept') },
    { check: (row) => (isFiniteNumber(row['amount']) ? null : 'invalidAmount') },
    {
      check: (row) =>
        row['scheduledId'] === undefined || isPosInteger(row['scheduledId'])
          ? null
          : 'invalidId',
    },
    {
      check: (row) =>
        row['accountId'] === undefined || isPosInteger(row['accountId']) ? null : 'invalidId',
    },
  ]);
  normalizeConcepts(transactions);
  pushDuplicateIds(problems, 'transactions', transactions);

  const profiles = validateTable(problems, 'profiles', tables['profiles'], [
    { check: (row) => (row['id'] === 1 ? null : 'invalidId') },
    { check: (row) => (isNonEmptyString(row['name']) ? null : 'invalidName') },
    { check: (row) => (isCurrency(row['currency'] as string) ? null : 'invalidCurrency') },
    { check: (row) => (isIsoDate(row['createdAt']) ? null : 'invalidCreatedAt') },
  ]);

  if (profiles.length > 1) {
    problems.push(problem('multipleProfiles', { table: 'profiles' }));
  }

  const accounts = validateTable(problems, 'accounts', tables['accounts'], [
    { check: (row) => (isPosInteger(row['id']) ? null : 'invalidId') },
    { check: (row) => (oneOf(ACCOUNT_TYPES)(row['type']) ? null : 'invalidAccountType') },
    {
      check: (row) =>
        row['categoryId'] === undefined || isPosInteger(row['categoryId'])
          ? null
          : 'invalidCategory',
    },
    { check: (row) => (isPosInteger(row['contactId']) ? null : 'invalidContact') },
    { check: (row) => (isOptionalString(row['concept']) ? null : 'invalidConcept') },
    { check: (row) => (isFiniteNumber(row['amount']) ? null : 'invalidAmount') },
    {
      check: (row) =>
        row['dueDate'] === undefined || isIsoDate(row['dueDate']) ? null : 'invalidDueDate',
    },
    { check: (row) => (oneOf(ACCOUNT_STATUSES)(row['status']) ? null : 'invalidStatus') },
  ]);
  normalizeConcepts(accounts);
  pushDuplicateIds(problems, 'accounts', accounts);

  const scheduledMovements = validateTable(
    problems,
    'scheduledMovements',
    tables['scheduledMovements'],
    [
      { check: (row) => (isPosInteger(row['id']) ? null : 'invalidId') },
      { check: (row) => (oneOf(TRANSACTION_TYPES)(row['type']) ? null : 'invalidType') },
      {
        check: (row) =>
          row['accountType'] === undefined || oneOf(ACCOUNT_TYPES)(row['accountType'])
            ? null
            : 'invalidAccountType',
      },
      { check: (row) => (isPosInteger(row['categoryId']) ? null : 'invalidCategory') },
      {
        check: (row) =>
          row['contactId'] === undefined || isPosInteger(row['contactId'])
            ? null
            : 'invalidContact',
      },
      { check: (row) => (isOptionalString(row['concept']) ? null : 'invalidConcept') },
      { check: (row) => (isFiniteNumber(row['amount']) ? null : 'invalidAmount') },
      { check: (row) => (isIsoDate(row['startDate']) ? null : 'invalidStartDate') },
      { check: (row) => (isIsoDate(row['nextDate']) ? null : 'invalidNextDate') },
      { check: (row) => (typeof row['active'] === 'boolean' ? null : 'invalidActive') },
      recurrenceValidator,
    ],
  );
  normalizeConcepts(scheduledMovements);
  pushDuplicateIds(problems, 'scheduledMovements', scheduledMovements);

  const attachments = validateTable(problems, 'attachments', tables['attachments'], [
    { check: (row) => (isPosInteger(row['id']) ? null : 'invalidId') },
    {
      check: (row) =>
        row['ownerType'] === undefined || oneOf(ATTACHMENT_OWNER_TYPES)(row['ownerType'])
          ? null
          : 'invalidOwnerType',
    },
    {
      check: (row) => (isPosInteger(row['ownerId']) ? null : 'invalidOwnerId'),
    },
    { check: (row) => (isNonEmptyString(row['name']) ? null : 'invalidName') },
    { check: (row) => (isNonEmptyString(row['mimeType']) ? null : 'invalidMimeType') },
    {
      check: (row) =>
        isFiniteNumber(row['size']) && (row['size'] as number) >= 0 ? null : 'invalidSize',
    },
    { check: (row) => (isNonEmptyString(row['data']) ? null : 'invalidBase64') },
  ]);
  pushDuplicateIds(problems, 'attachments', attachments);

  const notes = validateTable(problems, 'notes', tables['notes'], [
    { check: (row) => (isPosInteger(row['id']) ? null : 'invalidId') },
    {
      check: (row) =>
        row['ownerType'] === undefined || oneOf(ATTACHMENT_OWNER_TYPES)(row['ownerType'])
          ? null
          : 'invalidOwnerType',
    },
    { check: (row) => (isPosInteger(row['ownerId']) ? null : 'invalidOwnerId') },
    { check: (row) => (isIsoDate(row['date']) ? null : 'invalidDate') },
    { check: (row) => (isNonEmptyString(row['text']) ? null : 'invalidText') },
  ]);
  pushDuplicateIds(problems, 'notes', notes);

  const categoryIds = positiveIds(categories);
  const contactIds = positiveIds(contacts);
  const relationshipTypeIds = positiveIds(relationshipTypes);
  const transactionIds = positiveIds(transactions);
  const accountIds = positiveIds(accounts);

  transactions.forEach((row, index) => {
    if (isPosInteger(row['categoryId']) && !categoryIds.has(row['categoryId'])) {
      problems.push(
        problem('missingCategoryReference', {
          table: 'transactions',
          index,
          id: row['categoryId'],
        }),
      );
    }

    if (isPosInteger(row['contactId']) && !contactIds.has(row['contactId'])) {
      problems.push(
        problem('missingContactReference', { table: 'transactions', index, id: row['contactId'] }),
      );
    }
  });

  accounts.forEach((row, index) => {
    if (isPosInteger(row['categoryId']) && !categoryIds.has(row['categoryId'])) {
      problems.push(
        problem('missingCategoryReference', { table: 'accounts', index, id: row['categoryId'] }),
      );
    }

    if (isPosInteger(row['contactId']) && !contactIds.has(row['contactId'])) {
      problems.push(
        problem('missingContactReference', { table: 'accounts', index, id: row['contactId'] }),
      );
    }
  });

  scheduledMovements.forEach((row, index) => {
    if (isPosInteger(row['categoryId']) && !categoryIds.has(row['categoryId'])) {
      problems.push(
        problem('missingCategoryReference', {
          table: 'scheduledMovements',
          index,
          id: row['categoryId'],
        }),
      );
    }

    if (isPosInteger(row['contactId']) && !contactIds.has(row['contactId'])) {
      problems.push(
        problem('missingContactReference', {
          table: 'scheduledMovements',
          index,
          id: row['contactId'],
        }),
      );
    }
  });

  contacts.forEach((row, index) => {
    if (
      isPosInteger(row['relationshipTypeId']) &&
      !relationshipTypeIds.has(row['relationshipTypeId'])
    ) {
      problems.push(
        problem('missingRelationshipReference', {
          table: 'contacts',
          index,
          id: row['relationshipTypeId'],
        }),
      );
    }
  });

  attachments.forEach((row, index) => {
    if (row['ownerType'] === 'account' && !accountIds.has(row['ownerId'] as number)) {
      problems.push(
        problem('invalidOwnerId', { table: 'attachments', index, id: row['ownerId'] as number }),
      );
    }

    if (row['ownerType'] === 'transaction' && !transactionIds.has(row['ownerId'] as number)) {
      problems.push(
        problem('invalidOwnerId', { table: 'attachments', index, id: row['ownerId'] as number }),
      );
    }
  });

  notes.forEach((row, index) => {
    if (row['ownerType'] === 'account' && !accountIds.has(row['ownerId'] as number)) {
      problems.push(
        problem('invalidOwnerId', { table: 'notes', index, id: row['ownerId'] as number }),
      );
    }

    if (row['ownerType'] === 'transaction' && !transactionIds.has(row['ownerId'] as number)) {
      problems.push(
        problem('invalidOwnerId', { table: 'notes', index, id: row['ownerId'] as number }),
      );
    }
  });

  if (problems.length > 0) {
    throw new StoreSnapshotError(problems);
  }

  return {
    app: STORE_SNAPSHOT_APP,
    version: STORE_SCHEMA_VERSION,
    exportedAt: raw['exportedAt'] as string,
    profileName:
      typeof raw['profileName'] === 'string' && raw['profileName'] !== ''
        ? raw['profileName']
        : undefined,
    tables: {
      profiles: profiles as unknown as readonly ProfileSnapshot[],
      categories: categories as unknown as readonly CategorySnapshot[],
      transactions: transactions as unknown as readonly TransactionSnapshot[],
      relationshipTypes: relationshipTypes as unknown as readonly RelationshipTypeSnapshot[],
      contacts: contacts as unknown as readonly ContactSnapshot[],
      accounts: accounts as unknown as readonly AccountSnapshot[],
      scheduledMovements: scheduledMovements as unknown as readonly ScheduledMovementSnapshot[],
      attachments: attachments as unknown as readonly AttachmentSnapshot[],
      notes: notes as unknown as readonly NoteSnapshot[],
    },
  };
}
