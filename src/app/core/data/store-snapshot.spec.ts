import {
  parseStoreSnapshot,
  STORE_SCHEMA_VERSION,
  STORE_SNAPSHOT_APP,
  StoreSnapshotError,
} from './store-snapshot';

const createSnapshot = (): Record<string, unknown> => ({
  app: STORE_SNAPSHOT_APP,
  version: STORE_SCHEMA_VERSION,
  exportedAt: '2026-10-11T12:00:00.000Z',
  profileName: 'Ada',
  tables: {
    profiles: [{ id: 1, name: 'Ada', currency: 'USD', createdAt: '2026-10-11T12:00:00.000Z' }],
    categories: [{ id: 1, name: 'General' }],
    transactions: [
      {
        id: 1,
        type: 'expense',
        categoryId: 1,
        date: '2026-10-11T12:00:00.000Z',
        concept: null,
        amount: 12.5,
      },
    ],
    relationshipTypes: [],
    contacts: [],
    accounts: [],
    scheduledMovements: [],
    attachments: [],
    notes: [],
  },
});

function getSnapshotError(raw: unknown): StoreSnapshotError {
  try {
    parseStoreSnapshot(raw);
  } catch (error) {
    if (error instanceof StoreSnapshotError) {
      return error;
    }

    throw error;
  }

  throw new Error('Expected snapshot validation to fail');
}

describe('parseStoreSnapshot', () => {
  it('validates data and returns the current schema version', () => {
    const result = parseStoreSnapshot(createSnapshot());

    expect(result.app).toBe(STORE_SNAPSHOT_APP);
    expect(result.version).toBe(STORE_SCHEMA_VERSION);
    expect(result.tables.transactions[0]?.concept).toBe('');
  });

  it('fills tables introduced after the imported schema version', () => {
    const legacySnapshot = createSnapshot();
    legacySnapshot['version'] = 6;
    const tables = legacySnapshot['tables'] as Record<string, unknown>;
    delete tables['notes'];

    const result = parseStoreSnapshot(legacySnapshot);

    expect(result.version).toBe(STORE_SCHEMA_VERSION);
    expect(result.tables.notes).toEqual([]);
  });

  it('rejects snapshots from unsupported future versions', () => {
    const snapshot = createSnapshot();
    snapshot['version'] = STORE_SCHEMA_VERSION + 1;

    const error = getSnapshotError(snapshot);

    expect(error.problems).toContainEqual(
      expect.objectContaining({ code: 'unsupportedVersion' }),
    );
  });

  it('rejects duplicate IDs within a table', () => {
    const snapshot = createSnapshot();
    const tables = snapshot['tables'] as Record<string, unknown>;
    tables['categories'] = [
      { id: 1, name: 'General' },
      { id: 1, name: 'Duplicate' },
    ];

    const error = getSnapshotError(snapshot);

    expect(error.problems).toContainEqual(
      expect.objectContaining({ code: 'duplicateId', table: 'categories', id: 1 }),
    );
  });

  it('rejects references to categories that do not exist', () => {
    const snapshot = createSnapshot();
    const tables = snapshot['tables'] as Record<string, unknown>;
    tables['transactions'] = [
      {
        id: 1,
        type: 'expense',
        categoryId: 99,
        date: '2026-10-11T12:00:00.000Z',
        concept: 'Missing category',
        amount: 12.5,
      },
    ];

    const error = getSnapshotError(snapshot);

    expect(error.problems).toContainEqual(
      expect.objectContaining({ code: 'missingCategoryReference', table: 'transactions', id: 99 }),
    );
  });

  it('rejects data that is not an object', () => {
    const error = getSnapshotError(null);

    expect(error.problems).toContainEqual(expect.objectContaining({ code: 'invalidFormat' }));
  });
});
