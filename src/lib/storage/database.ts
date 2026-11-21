import { openDB, type DBSchema } from 'idb';

interface AudioVerseDatabase extends DBSchema {
  preferences: { key: string; value: unknown };
}

// Open lazily: storage restrictions must never prevent the application rendering.
export function openDatabase() {
  return openDB<AudioVerseDatabase>('audioverse-kids', 1, {
    upgrade(database) {
      database.createObjectStore('preferences');
    },
    blocking(_currentVersion, _blockedVersion, event) {
      const target = event.target;
      if (target instanceof IDBDatabase) target.close();
    },
  });
}
