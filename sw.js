const CACHE = 'pokepath-gh1';

async function rangeResponse(res, range) {
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  let start = m[1] ? parseInt(m[1]) : 0;
  let end = m[2] ? parseInt(m[2]) : buf.byteLength - 1;
  if (!m[1] && m[2]) { start = buf.byteLength - parseInt(m[2]); end = buf.byteLength - 1; }
  end = Math.min(end, buf.byteLength - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
const CORE = ['./', './index.html', './styles.css', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Scarica in background tutti i file del gioco, a blocchi, saltando quelli già in cache
async function precacheAll() {
  const cache = await caches.open(CACHE);
  const list = await (await fetch('./filelist.json', { cache: 'no-store' })).json();
  const have = new Set((await cache.keys()).map(r => new URL(r.url).pathname));
  const todo = list.filter(u => !have.has(new URL(u, self.registration.scope).pathname));
  for (let i = 0; i < todo.length; i += 20) {
    await Promise.all(todo.slice(i, i + 20).map(u => cache.add(u).catch(() => {})));
  }
}

self.addEventListener('message', e => {
  if (e.data === 'precache') e.waitUntil(precacheAll());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(url.pathname, { ignoreSearch: true }) || await cache.match(e.request, { ignoreSearch: true });
    const range = e.request.headers.get('range');
    if (hit && range) return rangeResponse(hit, range);
    if (hit) return hit;
    if (range) {
      // media non ancora in cache: scarica intero, salva, poi servi il pezzo richiesto
      const full = await fetch(url.pathname);
      if (full.ok) { await cache.put(url.pathname, full.clone()); return rangeResponse(full, range); }
      return full;
    }
    const res = await fetch(e.request);
    if (res.ok && res.status === 200) cache.put(e.request, res.clone());
    return res;
  })());
});
