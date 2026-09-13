(function () {
  const DB_NAME = "pgw-nsi-quest";
  const DB_VERSION = 1;
  const ANSWERS = "answers";
  const QUEUE = "queue";

  let dbPromise;

  function openDb() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(ANSWERS)) {
            const store = db.createObjectStore(ANSWERS, { keyPath: "id" });
            store.createIndex("by_scope", "scope", { unique: false });
          }
          if (!db.objectStoreNames.contains(QUEUE)) {
            const store = db.createObjectStore(QUEUE, { keyPath: "id" });
            store.createIndex("by_scope", "scope", { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function tx(storeName, mode, callback) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let result;
      try {
        const request = callback(store);
        if (request instanceof IDBRequest) {
          request.onsuccess = () => { result = request.result; };
          request.onerror = () => reject(request.error);
        } else {
          result = request;
        }
      } catch (error) { reject(error); return; }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Transaction IndexedDB annulée"));
    });
  }

  function scopedId(scope, questionKey) { return `${scope}::${questionKey}`; }

  window.PGWStorage = {
    async saveAnswer(scope, missionKey, questionKey, value) {
      const row = { id: scopedId(scope, questionKey), scope, missionKey, questionKey, value, updatedAt: new Date().toISOString() };
      await tx(ANSWERS, "readwrite", store => store.put(row));
      return row;
    },
    async getAnswers(scope) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(ANSWERS, "readonly");
        const index = transaction.objectStore(ANSWERS).index("by_scope");
        const req = index.getAll(scope);
        req.onsuccess = () => {
          const map = {};
          (req.result || []).forEach(row => { map[row.questionKey] = row.value; });
          resolve(map);
        };
        req.onerror = () => reject(req.error);
      });
    },
    async queue(scope, payload) {
      const row = { id: scopedId(scope, payload.question_key), scope, payload, queuedAt: new Date().toISOString() };
      await tx(QUEUE, "readwrite", store => store.put(row));
      return row;
    },
    async getQueue(scope) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(QUEUE, "readonly");
        const index = transaction.objectStore(QUEUE).index("by_scope");
        const req = index.getAll(scope);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },
    async removeQueued(id) {
      await tx(QUEUE, "readwrite", store => store.delete(id));
    },
    async clearScope(scope) {
      const db = await openDb();
      for (const storeName of [ANSWERS, QUEUE]) {
        await new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, "readwrite");
          const store = transaction.objectStore(storeName);
          const index = store.index("by_scope");
          const req = index.openCursor(IDBKeyRange.only(scope));
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) { cursor.delete(); cursor.continue(); }
          };
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      }
    }
  };
})();
