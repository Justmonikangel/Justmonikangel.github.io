/* SmartSplit · in-memory state container, bridged to IndexedDB through
   the auth flow and split-save points. */
window.SS_STORE = (function () {
  const SESSION_KEY = "smartsplit:session";

  const DEFAULT = {
    currentUser: null,           // { username, displayName, ... } when logged in
    squad: [],                   // [{ id, name, avatar }]
    receipt: null,               // { id, title, placeName, items[], serviceFeeCents }
    history: [],                 // [{ id, title, placeName, settledAt, totalCents, ... }]
    lastParseMs: 0,              // for "Parsed in N ms" display
  };

  let state = clone(DEFAULT);
  const subs = new Set();

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function getState() { return state; }

  function setState(patch) {
    state = { ...state, ...patch };
    subs.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } });
  }

  function update(fn) {
    const next = fn(state);
    if (next && next !== state) state = next;
    subs.forEach((s) => { try { s(state); } catch (e) { console.error(e); } });
  }

  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }

  function reset() { state = clone(DEFAULT); }

  let _seq = 0;
  function newId(prefix) {
    _seq += 1;
    return prefix + "_" + Date.now().toString(36) + "_" + _seq.toString(36);
  }

  /* ---------- Session ---------- */
  function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch (e) { return null; }
  }
  function saveSession(user) {
    if (!user) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify({
      username: user.username, displayName: user.displayName,
    }));
  }

  return {
    getState, setState, update, subscribe, reset, newId,
    loadSession, saveSession,
  };
})();
