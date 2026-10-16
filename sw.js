/* Dino Aventura — guarda o jogo no aparelho para funcionar sem internet.
   Mude o nome do cache a cada versão para os aparelhos baixarem os arquivos novos. */
const CACHE = 'dino-aventura-v0.3.0';
const ARQUIVOS = ['./', 'index.html', 'style.css', 'jogo.js', 'mundo3d.js', 'logo.webp', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

// Responde do aparelho na hora e, se houver internet, atualiza a cópia guardada para a próxima abertura.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.url.endsWith('.apk')) return;   // o APK vem sempre direto da internet
  e.respondWith(caches.open(CACHE).then(async cache => {
    const guardado = await cache.match(e.request, { ignoreSearch: true });
    const daRede = fetch(e.request, { cache: 'no-cache' }).then(r => {
      if (r.ok) cache.put(e.request, r.clone());
      return r;
    }).catch(() => guardado);
    return guardado || daRede;
  }));
});
