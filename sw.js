// Service Worker para funcionamiento offline y Push Notifications
const CACHE_NAME = 'biblioteca-pwa-v2';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Estrategia: Network First para API, Cache First para recursos estáticos
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // NO cachear peticiones a la API - siempre ir a la red
    if (url.pathname.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return response;
                })
                .catch(() => {
                    return new Response('Network error', { status: 408 });
                })
        );
        return;
    }
    
    // Para recursos estáticos, usar Cache First
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    if (event.request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
    console.log('Service Worker recibió mensaje:', event.data);
    
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data;
        showNotification(title, body);
    }
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
    console.log('Push event recibido:', event);
    
    let notificationData = {
        title: 'Biblioteca PWA',
        body: 'Tienes una nueva notificación',
        icon: './icon.svg',
        badge: './icon.svg'
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                data: data.data || {}
            };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            data: notificationData.data,
            tag: 'biblioteca-notification',
            requireInteraction: false,
            vibrate: [200, 100, 200]
        })
    );
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('Notificación clickeada:', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Si hay una ventana abierta, enfocarla
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === self.location.origin + '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Si no hay ventana abierta, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Función para mostrar notificación
function showNotification(title, body) {
    const notificationOptions = {
        body: body,
        icon: './icon.svg',
        badge: './icon.svg',
        tag: 'biblioteca-notification',
        requireInteraction: false,
        vibrate: [200, 100, 200]
    };
    
    return self.registration.showNotification(title, notificationOptions);
}

// Manejar sincronización en segundo plano
self.addEventListener('sync', (event) => {
    console.log('Background sync:', event.tag);
    
    if (event.tag === 'sync-operations') {
        event.waitUntil(
            syncPendingOperations()
        );
    }
});

async function syncPendingOperations() {
    // Esta función se puede expandir para sincronizar operaciones pendientes
    console.log('Sincronizando operaciones pendientes...');
}
