const CACHE_NAME = 'bucci-v1';  //  Important:  Change this version when you update your service worker!
const urlsToCache = [
    '/',
    '/index',
    '/CSS/style.css',  //  Adjust these paths to match your CSS files
    '/js/script.js',    //  Adjust these paths to match your JavaScript files
    '/images/logo.png',  //  Adjust these paths to match your image files
    '/images/logo.png',  //  Adjust these paths to match your image files
];

// Installation
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);  //  Add files to the cache
            })
    );
});

// Fetch
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)  //  Check if the resource is in the cache
            .then((response) => {
                if (response) {
                    return response;  //  Return the cached version if found
                }
                return fetch(event.request);  //  Otherwise, fetch from the network
            })
    );
});

// Activate
 self.addEventListener('activate', (event) => {
   const cacheWhitelist = [CACHE_NAME]; //Add new Cache names here
   event.waitUntil(
     caches.keys().then((cacheNames) => {
       return Promise.all(
         cacheNames.map((cacheName) => {
           if (cacheWhitelist.indexOf(cacheName) === -1) {
             // Delete caches that are not in the whitelist.
             return caches.delete(cacheName);
           }
         })
       );
     })
   );
 });
