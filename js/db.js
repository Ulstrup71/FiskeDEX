// Lille wrapper omkring IndexedDB. Alt gemmes lokalt på enheden.
const DB_NAME = "fiskedex";
const DB_VERSION = 1;
const STORES = ["catches", "photos", "spots", "marks", "meta"];

let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("catches")) {
        const s = db.createObjectStore("catches", { keyPath: "id" });
        s.createIndex("speciesId", "speciesId");
      }
      if (!db.objectStoreNames.contains("photos")) {
        const s = db.createObjectStore("photos", { keyPath: "id" });
        s.createIndex("catchId", "catchId");
      }
      if (!db.objectStoreNames.contains("spots")) db.createObjectStore("spots", { keyPath: "id" });
      if (!db.objectStoreNames.contains("marks")) db.createObjectStore("marks", { keyPath: "speciesId" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode = "readonly") {
  const db = await open();
  return db.transaction(store, mode).objectStore(store);
}

export const db = {
  async all(store) { return wrap((await tx(store)).getAll()); },
  async get(store, key) { return wrap((await tx(store)).get(key)); },
  async put(store, value) { return wrap((await tx(store, "readwrite")).put(value)); },
  async del(store, key) { return wrap((await tx(store, "readwrite")).delete(key)); },
  async byIndex(store, index, value) { return wrap((await tx(store)).index(index).getAll(value)); },
  async clear(store) { return wrap((await tx(store, "readwrite")).clear()); },
  async clearAll() { for (const s of STORES) await this.clear(s); },
  STORES,
};

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Skalerer billedet ned og gemmer som JPEG, så databasen ikke bliver enorm.
export async function compressImage(file, maxSize = 1600, quality = 0.82) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  const w = bitmap.width, h = bitmap.height;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function dataURLToBlob(url) {
  return (await fetch(url)).blob();
}
