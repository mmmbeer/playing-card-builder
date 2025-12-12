const DB_NAME = 'card-designer';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

function createId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'img-' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) return resolve(blob);
      reject(new Error('Failed to create blob from canvas'));
    }, 'image/png');
  });
}

async function renderSourceToBlob(source) {
  if (!source) throw new Error('Missing image source');

  if (source instanceof Blob) {
    const { width, height } = await measureBlob(source);
    return { blob: source, width, height };
  }

  let width = source.width || source.naturalWidth || source.videoWidth || 1;
  let height = source.height || source.naturalHeight || source.videoHeight || 1;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, width, height);

  const blob = await canvasToBlob(canvas);
  return { blob, width, height };
}

async function measureBlob(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await blobToImage(blob, url);
    return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function blobToImage(blob, urlOverride) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image blob'));
    img.src = urlOverride || URL.createObjectURL(blob);
  });
}

export async function saveImageFromSource(source, type, existingId = null) {
  const { blob, width, height } = await renderSourceToBlob(source);
  return saveImageBlob(blob, type, width, height, existingId);
}

export async function saveImageBlob(blob, type, width, height, existingId = null) {
  const db = await openDatabase();
  const id = existingId || createId();
  const record = { id, blob, type, width, height, createdAt: Date.now() };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error || new Error('Failed to save image'));

    tx.objectStore(IMAGE_STORE).put(record);
  });
}

export async function getImageRecord(id) {
  if (!id) return null;
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readonly');
    const req = tx.objectStore(IMAGE_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Failed to load image'));
  });
}

export async function getImageElement(id) {
  const record = await getImageRecord(id);
  if (!record?.blob) return null;
  const url = URL.createObjectURL(record.blob);
  const img = await blobToImage(record.blob, url);
  try {
    if (img.decode) await img.decode();
  } catch (_) {}
  return img;
}

export async function deleteImage(id) {
  if (!id) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to delete image'));
    tx.objectStore(IMAGE_STORE).delete(id);
  });
}

export async function clearImageStore() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to clear images'));
    tx.objectStore(IMAGE_STORE).clear();
  });
}

export function deleteImageDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to delete database'));
    req.onblocked = () => reject(new Error('Database deletion blocked'));
  });
}

export async function dataUrlToBlob(url) {
  const response = await fetch(url);
  return response.blob();
}

export { IMAGE_STORE, DB_NAME };
