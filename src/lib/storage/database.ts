import { openDB, type DBSchema } from 'idb';

interface AudioVerseDatabase extends DBSchema {
  preferences: { key: string; value: unknown };
  activityProgress: { key: string; value: unknown };
  audioAssets: { key: string; value: { src: string; blob: Blob } };
}

// Open lazily: storage restrictions must never prevent the application rendering.
export function openDatabase() {
  return openDB<AudioVerseDatabase>('audioverse-kids', 3, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('preferences'))
        database.createObjectStore('preferences');
      if (!database.objectStoreNames.contains('activityProgress'))
        database.createObjectStore('activityProgress');
      if (!database.objectStoreNames.contains('audioAssets'))
        database.createObjectStore('audioAssets');
    },
    blocking(_currentVersion, _blockedVersion, event) {
      const target = event.target;
      if (target instanceof IDBDatabase) target.close();
    },
  });
}
