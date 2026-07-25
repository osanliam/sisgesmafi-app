// Persistent, per-browser outbox for grade changes.  It is deliberately
// separate from the visible grade cache: a note stays here until the cloud
// confirms its individual record was accepted.
const DATABASE_NAME = 'sisgesmafi-grade-outbox';
const DATABASE_VERSION = 1;
const STORE_NAME = 'operations';
const FALLBACK_KEY = 'sga_grade_outbox_fallback_v1';

const gradeKey = (grade) => `${grade?.studentId || ''}::${grade?.evaluationId || ''}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

const openDatabase = () => new Promise((resolve, reject) => {
  if (!window.indexedDB) {
    reject(new Error('IndexedDB is not available in this browser.'));
    return;
  }
  const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Could not open the local grade store.'));
});

const fallbackRead = () => {
  try {
    const value = JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (_) {
    return [];
  }
};

const fallbackWrite = (operations) => localStorage.setItem(FALLBACK_KEY, JSON.stringify(operations));

const transaction = async (mode, callback) => {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      let result;
      try {
        result = callback(store);
      } catch (error) {
        reject(error);
        return;
      }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('Local grade transaction failed.'));
      tx.onabort = () => reject(tx.error || new Error('Local grade transaction was cancelled.'));
    });
  } finally {
    db.close();
  }
};

export const queueGradeOperations = async (grades) => {
  const operations = (Array.isArray(grades) ? grades : [])
    .filter((grade) => grade?.studentId && grade?.evaluationId)
    .map((grade) => ({
      key: gradeKey(grade),
      grade: clone(grade),
      queuedAt: new Date().toISOString()
    }));
  if (!operations.length) return [];

  try {
    await transaction('readwrite', (store) => operations.forEach((operation) => store.put(operation)));
  } catch (_) {
    const existing = new Map(fallbackRead().map((operation) => [operation.key, operation]));
    operations.forEach((operation) => existing.set(operation.key, operation));
    fallbackWrite(Array.from(existing.values()));
  }
  return operations;
};

export const listQueuedGradeOperations = async () => {
  try {
    const db = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error || new Error('Could not read local grade changes.'));
      });
    } finally {
      db.close();
    }
  } catch (_) {
    return fallbackRead();
  }
};

// Delete only operations that have not been replaced by a newer local edit
// while the network request was in progress.
export const acknowledgeGradeOperations = async (operations) => {
  const acknowledgements = new Map((operations || []).map((operation) => [operation.key, operation.queuedAt]));
  if (!acknowledgements.size) return;
  try {
    await transaction('readwrite', (store) => {
      acknowledgements.forEach((queuedAt, key) => {
        const request = store.get(key);
        request.onsuccess = () => {
          if (request.result?.queuedAt === queuedAt) store.delete(key);
        };
      });
    });
  } catch (_) {
    fallbackWrite(fallbackRead().filter((operation) => acknowledgements.get(operation.key) !== operation.queuedAt));
  }
};

export const countQueuedGradeOperations = async () => (await listQueuedGradeOperations()).length;

export const applyQueuedGrades = (grades, operations) => {
  const merged = new Map((Array.isArray(grades) ? grades : []).map((grade) => [gradeKey(grade), grade]));
  (operations || []).forEach((operation) => {
    if (operation?.grade?.studentId && operation.grade.evaluationId) {
      merged.set(operation.key, operation.grade);
    }
  });
  return Array.from(merged.values());
};
