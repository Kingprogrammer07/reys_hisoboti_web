import { CreateEntryPayload, createEntry } from "../api/entries";

const DB_NAME = "mandarin_offline_db";
const STORE_NAME = "pending_entries";
const DB_VERSION = 1;

export interface OfflinePhotoItem {
  name: string;
  type: string;
  dataUrl: string; // Base64 data URL
}

export interface OfflineEntryRecord {
  localId: string;
  payload: CreateEntryPayload;
  photos: OfflinePhotoItem[];
  createdAt: number;
  retryCount: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      return reject(new Error("IndexedDB ushbu brauzerda qo'llab-quvvatlanmaydi"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export async function saveToOfflineQueue(
  payload: CreateEntryPayload,
  photos?: (File | Blob)[]
): Promise<string> {
  const db = await openDB();
  const localId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const photoItems: OfflinePhotoItem[] = [];
  if (photos && photos.length > 0) {
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const dataUrl = await blobToDataUrl(p);
      const name = (p as File).name || `foto_${i + 1}.jpg`;
      photoItems.push({
        name,
        type: p.type || "image/jpeg",
        dataUrl,
      });
    }
  }

  const record: OfflineEntryRecord = {
    localId,
    payload,
    photos: photoItems,
    createdAt: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => resolve(localId);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineQueueCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function getAllOfflineEntries(): Promise<OfflineEntryRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removeOfflineEntry(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(localId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

let _isSyncing = false;

export async function clearAllOfflineEntries(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

export async function syncOfflineQueue(
  onSuccessOne?: (localId: string) => void
): Promise<{ synced: number; failed: number }> {
  if (_isSyncing || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  _isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const records = await getAllOfflineEntries();
    if (!records || records.length === 0) {
      return { synced: 0, failed: 0 };
    }

    for (const record of records) {
      try {
        // Convert base64 data URLs back to Blobs
        const blobs = record.photos.map((p) => dataUrlToBlob(p.dataUrl));

        // Send to backend API
        await createEntry(record.payload, blobs);

        // Remove from local IndexedDB
        await removeOfflineEntry(record.localId);
        synced++;
        if (onSuccessOne) onSuccessOne(record.localId);
      } catch (err: any) {
        console.warn(`Offline entry ${record.localId} sync failed:`, err);
        failed++;

        // If it's a 4xx client/validation error, retry will never succeed.
        // Increment retryCount or discard after 3 attempts so queue isn't permanently locked
        const status = err?.status || (err?.response && err.response.status);
        if (status && status >= 400 && status < 500) {
          console.error(`Oflayn yozuv xato tufayli o'chirildi (${status}):`, err);
          await removeOfflineEntry(record.localId);
        } else if (!navigator.onLine) {
          break;
        }
      }
    }
  } finally {
    _isSyncing = false;
  }

  return { synced, failed };
}
