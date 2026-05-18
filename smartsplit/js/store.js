/* SmartSplit · single state container, persisted to localStorage. */
window.SS_STORE = (function () {
  const KEY = "smartsplit:v2";
  const DEFAULT = {
    squad: [{ id: "p_self", name: "Me" }],
    receipt: null,
    history: [],
  };

  let state = clone(DEFAULT);
  const subs = new Set();

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state = {
        squad: Array.isArray(parsed.squad) && parsed.squad.length > 0
          ? parsed.squad
          : DEFAULT.squad.slice(),
        receipt: parsed.receipt || null,
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    } catch (e) {
      console.warn("[SmartSplit] failed to load state", e);
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn("[SmartSplit] save failed", e); }
  }

  function getState() { return state; }

  function update(fn) {
    const next = fn(state);
    if (next && next !== state) state = next;
    save();
    subs.forEach((s) => { try { s(state); } catch (e) { console.error(e); } });
  }

  function subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }

  let _seq = 0;
  function newId(prefix) {
    _seq += 1;
    return prefix + "_" + Date.now().toString(36) + "_" + _seq.toString(36);
  }

  return { load, save, getState, update, subscribe, newId };
})();
