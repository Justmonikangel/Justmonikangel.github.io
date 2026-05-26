const BASE = '/api/sessions';

function getToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('relay-token') || '';
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem('relay-token', token);
  else window.localStorage.removeItem('relay-token');
}

function headers(extra) {
  const h = { ...(extra || {}) };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function asJson(res) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: () => fetch('/health').then(asJson),
  listSessions: () => fetch(BASE, { headers: headers() }).then(asJson),
  createSession: (title) =>
    fetch(BASE, {
      method: 'POST',
      headers: headers({ 'content-type': 'application/json' }),
      body: JSON.stringify({ title }),
    }).then(asJson),
  getSession: (id) => fetch(`${BASE}/${id}`, { headers: headers() }).then(asJson),
  patchSession: (id, body) =>
    fetch(`${BASE}/${id}`, {
      method: 'PATCH',
      headers: headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(body),
    }).then(asJson),
  getTurns: (id) => fetch(`${BASE}/${id}/turns`, { headers: headers() }).then(asJson),
  listSkills: () => fetch(`${BASE}/skills`, { headers: headers() }).then(asJson),
  upload: async (id, files) => {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    return fetch(`${BASE}/${id}/upload`, { method: 'POST', headers: headers(), body: fd }).then(asJson);
  },
  forkHref: (id) => {
    const token = getToken();
    return token
      ? `${BASE}/${id}/fork?_t=${encodeURIComponent(token)}`
      : `${BASE}/${id}/fork`;
  },
  downloadFork: async (id, filename) => {
    const res = await fetch(`${BASE}/${id}/fork`, { headers: headers() });
    if (!res.ok) throw new Error(`fork failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export async function streamTurn(id, { target, message }, handlers) {
  const res = await fetch(`${BASE}/${id}/turn`, {
    method: 'POST',
    headers: headers({ 'content-type': 'application/json' }),
    body: JSON.stringify({ target, message }),
  });
  if (!res.ok || !res.body) throw new Error(`turn failed: ${res.status}`);
  await readSse(res.body, handlers);
}

export async function streamAutoRelay(id, body, handlers) {
  const res = await fetch(`${BASE}/${id}/auto-relay`, {
    method: 'POST',
    headers: headers({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`auto-relay failed: ${res.status}`);
  await readSse(res.body, handlers);
}

async function readSse(body, handlers) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      dispatch(block, handlers);
    }
  }
  if (buf.trim()) dispatch(buf, handlers);
}

function dispatch(block, handlers) {
  let event = 'message';
  let dataLines = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
  }
  const data = dataLines.join('\n');
  if (event === 'delta' && handlers.onDelta) handlers.onDelta(data);
  else if (event === 'turn-start' && handlers.onTurnStart) {
    try { handlers.onTurnStart(JSON.parse(data)); } catch { handlers.onTurnStart({ raw: data }); }
  } else if (event === 'done' && handlers.onDone) handlers.onDone(data);
  else if (event === 'error' && handlers.onError) handlers.onError(data);
}
