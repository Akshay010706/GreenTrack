const CACHE_NAME = 'greentrack-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/landing.html',
    '/styles.css',
    '/landing.css',
    '/js/main.js',
    '/js/auth.js',
    '/js/db.js',
    '/js/router.js',
    '/js/utils.js',
    '/js/training.js',
    '/js/report-system.js',
    '/js/map-system.js',
    '/js/dashboard.js',
    '/js/facility-system.js',
    '/js/incentive-system.js',
    '/js/profile.js',
    '/js/login.js',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
