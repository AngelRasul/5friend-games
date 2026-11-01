import { CharacterId } from '../types/game';

const DB_NAME = 'ugadai_spinu_avatars_db';
const DB_VERSION = 1;
const STORE_NAME = 'avatars';
const FALLBACK_PREFIX = 'ugadai_spinu_avatar_fallback_';

interface StoredAvatarRecord {
  characterId: CharacterId;
  dataUrl: string;
  updatedAt: number;
}

function openAvatarDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB не поддерживается в текущем окружении.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'characterId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onblocked = () =>
      reject(new Error('Локальная база фотографий временно заблокирована.'));
    request.onerror = () =>
      reject(request.error ?? new Error('Не удалось открыть локальную базу фотографий.'));
  });
}

/**
 * Сохраняет фотографию персонажа в IndexedDB локально на устройстве.
 * При недоступности IndexedDB (например, строгий приватный режим) использует резерв в localStorage.
 */
export async function saveCharacterAvatar(
  characterId: CharacterId,
  dataUrl: string
): Promise<void> {
  try {
    const db = await openAvatarDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredAvatarRecord = {
        characterId,
        dataUrl,
        updatedAt: Date.now(),
      };
      store.put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Ошибка записи фотографии в IndexedDB.'));
      };
    });
  } catch {
    try {
      window.localStorage.setItem(`${FALLBACK_PREFIX}${characterId}`, dataUrl);
    } catch {
      // Игнорируем переполнение резервного хранилища
    }
  }
}

/**
 * Загружает все сохранённые фотографии персонажей с устройства пользователя.
 */
export async function loadAllCharacterAvatars(): Promise<Partial<Record<CharacterId, string>>> {
  const result: Partial<Record<CharacterId, string>> = {};
  const ids: CharacterId[] = ['rasul', 'salikh', 'mikail', 'denislam', 'izamutdin'];

  // Сначала читаем резервные ключи (например, для приватного режима Safari)
  for (const id of ids) {
    try {
      const fallback = window.localStorage.getItem(`${FALLBACK_PREFIX}${id}`);
      if (fallback) {
        result[id] = fallback;
      }
    } catch {
      // Игнорируем ошибки чтения резервного хранилища
    }
  }

  try {
    const db = await openAvatarDatabase();
    const records = await new Promise<StoredAvatarRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredAvatarRecord[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('Ошибка чтения IndexedDB.'));
      tx.oncomplete = () => db.close();
    });

    for (const item of records) {
      if (item?.characterId && typeof item.dataUrl === 'string' && item.dataUrl.length > 0) {
        result[item.characterId] = item.dataUrl;
      }
    }
  } catch {
    // Оставляем значения из резервного хранилища
  }

  return result;
}

/**
 * Удаляет сохранённую фотографию конкретного персонажа.
 */
export async function deleteCharacterAvatar(characterId: CharacterId): Promise<void> {
  try {
    const db = await openAvatarDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(characterId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Ошибка удаления из IndexedDB.'));
      };
    });
  } catch {
    // Переходим к очистке резервного хранилища
  }

  try {
    window.localStorage.removeItem(`${FALLBACK_PREFIX}${characterId}`);
  } catch {
    // Игнорируем ошибку доступа
  }
}

/**
 * Полностью удаляет все сохранённые фотографии всех персонажей из IndexedDB и резервного хранилища.
 */
export async function clearAllCharacterAvatars(): Promise<void> {
  try {
    const db = await openAvatarDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Ошибка очистки базы IndexedDB.'));
      };
    });
  } catch {
    // Переходим к очистке резервных ключей
  }

  const ids: CharacterId[] = ['rasul', 'salikh', 'mikail', 'denislam', 'izamutdin'];
  for (const id of ids) {
    try {
      window.localStorage.removeItem(`${FALLBACK_PREFIX}${id}`);
    } catch {
      // Игнорируем ошибки доступа
    }
  }
}
