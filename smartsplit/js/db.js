/* SmartSplit · IndexedDB wrapper.
   Two object stores:
     users    keyPath=username  (passwordHash, displayName, createdAt)
     splits   keyPath=id        (userId index for per-user history)
   Seeds a demo user (monika / monika) on first open. */
(function () {
  "use strict";
  const DB_NAME = "smartsplit";
  const DB_VERSION = 1;

  let dbPromise = null;

  async function sha256(str) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    // Fallback for ancient browsers: simple djb2 (NOT secure, demo only)
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return "djb2_" + (h >>> 0).toString(16);
  }

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "username" });
        }
        if (!db.objectStoreNames.contains("splits")) {
          const store = db.createObjectStore("splits", { keyPath: "id" });
          store.createIndex("byUser", "userId", { unique: false });
        }
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return dbPromise;
  }

  function readonly(store, fn) {
    return open().then((db) => new Promise((res, rej) => {
      const t = db.transaction(store, "readonly");
      const s = t.objectStore(store);
      const out = fn(s);
      t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out);
      t.onerror = () => rej(t.error);
    }));
  }

  function readwrite(store, fn) {
    return open().then((db) => new Promise((res, rej) => {
      const t = db.transaction(store, "readwrite");
      const s = t.objectStore(store);
      const out = fn(s);
      t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out);
      t.onerror = () => rej(t.error);
    }));
  }

  function reqAsPromise(req) {
    return new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  async function getUser(username) {
    return open().then((db) => new Promise((res, rej) => {
      const req = db.transaction("users", "readonly").objectStore("users").get(username);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    }));
  }

  async function createUser({ username, password, displayName }) {
    if (!username || !password) throw new Error("Username and password required");
    const existing = await getUser(username);
    if (existing) throw new Error("Username already taken");
    const passwordHash = await sha256(password);
    const user = {
      username,
      displayName: (displayName || username).trim() || username,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await readwrite("users", (s) => s.put(user));
    return user;
  }

  async function verifyLogin({ username, password }) {
    const user = await getUser(username);
    if (!user) return null;
    const hash = await sha256(password);
    return hash === user.passwordHash ? user : null;
  }

  async function seedDemoUser() {
    const existing = await getUser("monika");
    if (existing) return existing;
    return createUser({
      username: "monika",
      password: "monika",
      displayName: "Monika",
    });
  }

  async function saveSplit(split) {
    if (!split.userId) throw new Error("Split missing userId");
    await readwrite("splits", (s) => s.put(split));
    return split;
  }

  async function listSplits(userId) {
    return open().then((db) => new Promise((res, rej) => {
      const t = db.transaction("splits", "readonly");
      const idx = t.objectStore("splits").index("byUser");
      const req = idx.getAll(userId);
      req.onsuccess = () => {
        const list = (req.result || []).sort((a, b) =>
          (b.settledAt || "").localeCompare(a.settledAt || ""));
        res(list);
      };
      req.onerror = () => rej(req.error);
    }));
  }

  async function deleteSplit(splitId) {
    await readwrite("splits", (s) => s.delete(splitId));
  }

  async function clearAll() {
    await readwrite("users", (s) => s.clear());
    await readwrite("splits", (s) => s.clear());
  }

  window.SS_DB = {
    open, getUser, createUser, verifyLogin, seedDemoUser,
    saveSplit, listSplits, deleteSplit, clearAll, sha256,
  };
})();
