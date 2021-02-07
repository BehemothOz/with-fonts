const CACHE_PREFIX = `cache`;
const CACHE_VER = `v8`;
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VER}`;

const HTTP_STATUS_OK = 200;
const RESPONSE_SAFE_TYPE = `basic`;

const whiteListDestinations = ['font', 'image'];

const static = [
    '/assets/fonts/roboto-latin-regular.woff2',
    '/assets/fonts/oswald-latin-regular.woff2',
    '/assets/fonts/philosopher-latin-regular.woff2',
    '/assets/fonts/roboto-latin-regular.woff',
    '/assets/fonts/oswald-latin-regular.woff',
    '/assets/fonts/philosopher-latin-regular.woff',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(static);
        })
    );
});

// Код выполнится, когда SW будет активирован.
self.addEventListener('activate', event => {
    event.waitUntil(
        /*
            caches.keys() - get all caches name
        */
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .map(key => {
                        // Удаляем только те кэши,
                        // которые начинаются с нашего префикса,
                        // но не совпадают по версии
                        if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
                            return caches.delete(key);
                        }

                        // Остальные не обрабатываем
                        return null;
                    })
                    .filter(key => key !== null)
            );
        })
    );
});

self.addEventListener('fetch', event => {
    /*
        Only for image and font destination
        https://css-tricks.com/serviceworker-for-offline/
    */
    if (!whiteListDestinations.includes(event.request.destination)) return;

    event.respondWith(
        caches.match(event.request).then(function (response) {
            // Cache hit - return response
            if (response) {
                return response;
            }

            return fetch(event.request).then(function (response) {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // IMPORTANT: Clone the response. A response is a stream
                // and because we want the browser to consume the response
                // as well as the cache consuming the response, we need
                // to clone it so we have two streams.
                var responseToCache = response.clone();

                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});
