// Local-only storage. Health data never leaves the device.
// Small data (entries, plan, prefs, test results) in localStorage; photos as Blobs in IndexedDB.

const PREFIX = 'reda:v1:';

function load(name, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(name, value) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const defaultLang = (navigator.language || 'id').toLowerCase().startsWith('id') ? 'id' : 'en';
const DEFAULT_PREFS = { lang: defaultLang, theme: 'auto', onboarded: false };

export const prefs = {
  get() {
    return { ...DEFAULT_PREFS, ...load('prefs', {}) };
  },
  set(patch) {
    save('prefs', { ...prefs.get(), ...patch });
  },
};

export const entries = {
  all() {
    return load('entries', {});
  },
  get(iso) {
    return entries.all()[iso] || null;
  },
  put(iso, entry) {
    const all = entries.all();
    all[iso] = { ...entry, savedAt: Date.now() };
    save('entries', all);
  },
  remove(iso) {
    const all = entries.all();
    delete all[iso];
    save('entries', all);
  },
  replace(all) {
    save('entries', all);
  },
};

export const plan = {
  get() {
    return load('plan', null);
  },
  set(value) {
    save('plan', value);
  },
};

export const tests = {
  all() {
    return load('tests', []);
  },
  add(result) {
    const list = tests.all();
    list.push({ ...result, at: Date.now() });
    save('tests', list);
  },
  replace(list) {
    save('tests', list);
  },
};

// ---- Photos (IndexedDB) ----
const DB_NAME = 'reda-photos';
let dbPromise = null;

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('photos');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function tx(mode, run) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('photos', mode);
    const result = run(transaction.objectStore('photos'));
    transaction.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
    transaction.onerror = () => reject(transaction.error);
  });
}

export const photos = {
  async put(blob) {
    const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    await tx('readwrite', (store) => store.put(blob, id));
    return id;
  },
  get(id) {
    return tx('readonly', (store) => store.get(id));
  },
  remove(id) {
    return tx('readwrite', (store) => store.delete(id));
  },
  async keys() {
    return tx('readonly', (store) => store.getAllKeys());
  },
  clear() {
    return tx('readwrite', (store) => store.clear());
  },
};

// Shrink a camera photo to at most 1280 px before storing.
export async function shrinkImage(file, max = 1280) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(url) {
  const response = await fetch(url);
  return response.blob();
}

// ---- Backup ----
export async function exportAll() {
  const photoData = {};
  for (const id of (await photos.keys()) || []) {
    const blob = await photos.get(id);
    if (blob) photoData[id] = await blobToDataUrl(blob);
  }
  return {
    app: 'reda',
    version: 1,
    exportedAt: new Date().toISOString(),
    prefs: prefs.get(),
    entries: entries.all(),
    plan: plan.get(),
    tests: tests.all(),
    photos: photoData,
  };
}

export async function importAll(data) {
  if (!data || data.app !== 'reda' || typeof data.entries !== 'object') throw new Error('bad file');
  entries.replace(data.entries);
  plan.set(data.plan || null);
  tests.replace(Array.isArray(data.tests) ? data.tests : []);
  if (data.prefs) prefs.set({ lang: data.prefs.lang, theme: data.prefs.theme, onboarded: true });
  for (const [id, url] of Object.entries(data.photos || {})) {
    const blob = await dataUrlToBlob(url);
    await tx('readwrite', (store) => store.put(blob, id));
  }
}

export async function wipeAll() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(PREFIX)) localStorage.removeItem(key);
  }
  try {
    await photos.clear();
  } catch {
    // no photo store yet
  }
}
