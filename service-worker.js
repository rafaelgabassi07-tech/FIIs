const CACHE_NAME = 'meu-invest-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Adicione outros arquivos estáticos que você queira cachear
  // Ex: '/styles/main.css', '/images/logo.png'
  // No nosso caso, a maioria dos recursos vem de um CDN, então o cache é simples.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          return response;
        }

        // Se não estiver no cache, busca na rede
        return fetch(event.request).then(
          response => {
            // Verifica se recebemos uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Importante: Clona a resposta. Uma resposta é um Stream e
            // só pode ser consumida uma vez. Precisamos de uma para o navegador
            // e uma para o cache.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});