// Daily recovery copies live beside the grade outbox in IndexedDB.  A snapshot
// is updated during the day (not only created once), keeping the newest state
// for each of the last 30 calendar days on this specific computer.
const DATABASE_NAME = 'sisgesmafi-daily-backups';
const DATABASE_VERSION = 1;
const STORE_NAME = 'snapshots';
const RETENTION_DAYS = 30;

const localDay = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const openDatabase = () => new Promise((resolve, reject) => {
  if (!window.indexedDB) return reject(new Error('IndexedDB is not available.'));
  const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'day' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Could not open daily backup storage.'));
});

const runTransaction = async (mode, action) => {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let result;
      try {
        result = action(store);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || new Error('Daily backup transaction failed.'));
    });
  } finally {
    db.close();
  }
};

const compactCourses = (courses = []) => courses.map(({ id, name }) => ({ id, name }));
const compactStudents = (students = []) => students.map(({ id, dni, name }) => ({ id, dni, name }));

export const saveDailyBackup = async ({ grades = [], evaluations = [], students = [], courses = [] }) => {
  const now = new Date().toISOString();
  const day = localDay();
  const snapshot = {
    day,
    createdAt: now,
    updatedAt: now,
    version: 3,
    totalGrades: grades.length,
    // The format intentionally stays compatible with the existing safe
    // restore/import screen: it restores missing records, never overwrites.
    grades,
    evaluations,
    students: compactStudents(students),
    courses: compactCourses(courses)
  };

  await runTransaction('readwrite', (store) => {
    const existing = store.get(day);
    existing.onsuccess = () => {
      if (existing.result?.createdAt) snapshot.createdAt = existing.result.createdAt;
      store.put(snapshot);
    };
    const oldestAllowed = localDay(new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000));
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (!current) return;
      if (current.key < oldestAllowed) current.delete();
      current.continue();
    };
  });
  return { day, updatedAt: now, totalGrades: grades.length };
};

export const getLatestDailyBackupMeta = async () => {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).openCursor(null, 'prev');
      request.onsuccess = () => {
        const snapshot = request.result?.value;
        resolve(snapshot ? {
          day: snapshot.day,
          createdAt: snapshot.createdAt,
          updatedAt: snapshot.updatedAt,
          totalGrades: snapshot.totalGrades
        } : null);
      };
      request.onerror = () => reject(request.error || new Error('Could not read daily backup metadata.'));
    });
  } finally {
    db.close();
  }
};
