const CACHE_NAME = 'vision-2026-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app-firebase.js',
    './manifest.json',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// 激活並清理舊緩存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 攔截請求 (離線優先策略)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果緩存有，直接返回
                if (response) {
                    return response;
                }
                // 否則從網絡獲取
                return fetch(event.request);
            })
    );
});

// 處理推送通知 (預留功能)
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '願景提醒';
    const options = {
        body: data.body || '是時候完成你的目標了！',
        icon: 'icon-192.png',
        badge: 'icon-192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});