// Estado de la aplicación
let currentUser = null;
let libros = [];
let calificaciones = [];
let editingLibroId = null;
let editingCalificacionId = null;
let currentModule = 'libros';
let isOnline = navigator.onLine;
let pendingOperations = [];
let dbReady = false;
let notificationPermission = Notification.permission;
let swRegistration = null;
let lastNotificationId = 0;
let notificationPoller = null;
const notificationCache = new Set();

// Configuración de la API
const API_BASE_URL = './api';

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    setupOnlineOfflineListeners();
    await initializeApp();
    checkAuth();
    requestNotificationPermission();
});

// Configurar listeners de conexión
function setupOnlineOfflineListeners() {
    window.addEventListener('online', async () => {
        isOnline = true;
        console.log('Conexión restaurada - Sincronizando operaciones pendientes...');
        await syncPendingOperations();
        if (currentModule === 'libros') {
            await loadLibros(true);
        } else {
            await loadCalificaciones(true);
        }
    });

    window.addEventListener('offline', () => {
        isOnline = false;
        console.log('Sin conexión - Modo offline activado');
    });
}

// Inicializar la aplicación
async function initializeApp() {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
        try {
            swRegistration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registrado:', swRegistration);
            
            // Escuchar mensajes del service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('Mensaje del Service Worker:', event.data);
                if (event.data && event.data.type === 'NOTIFICATION') {
                    createLocalNotification(event.data.title, event.data.body, 'sistema');
                }
            });
        } catch (error) {
            console.error('Error al registrar Service Worker:', error);
        }
    }

    // Inicializar IndexedDB
    await initDB();
    
    console.log('Estado de conexión al inicializar:', navigator.onLine ? 'Online' : 'Offline');
}

// Inicializar IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.warn('IndexedDB no está disponible');
            dbReady = false;
            resolve();
            return;
        }

        const request = indexedDB.open('BibliotecaDB', 3);

        request.onerror = () => {
            console.error('Error al abrir IndexedDB:', request.error);
            dbReady = false;
            reject(request.error);
        };

        request.onsuccess = () => {
            window.db = request.result;
            dbReady = true;
            console.log('IndexedDB inicializado correctamente');
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('libros')) {
                const librosStore = db.createObjectStore('libros', { keyPath: 'idLibro' });
                librosStore.createIndex('titulo', 'titulo', { unique: false });
                librosStore.createIndex('autor', 'autor', { unique: false });
            }
            if (!db.objectStoreNames.contains('calificaciones')) {
                const califStore = db.createObjectStore('calificaciones', { keyPath: 'idCalificacion' });
                califStore.createIndex('idLibro', 'idLibro', { unique: false });
            }
            if (!db.objectStoreNames.contains('pending_operations')) {
                db.createObjectStore('pending_operations', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('notifications')) {
                db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Verificar que IndexedDB esté listo
function ensureDBReady() {
    if (!dbReady || !window.db) {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (dbReady && window.db) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }
    return Promise.resolve();
}

// Navegación entre páginas
function showLanding() {
    document.getElementById('landing-page').classList.add('active');
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('admin-page').classList.remove('active');
}

function showLogin() {
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('login-page').classList.add('active');
    document.getElementById('admin-page').classList.remove('active');
}

function showAdmin() {
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('admin-page').classList.add('active');
    if (currentModule === 'libros') {
        loadLibros();
    } else {
        loadCalificaciones();
    }
    startNotificationPolling();
}

// Cambiar entre módulos
function showModule(module) {
    currentModule = module;
    
    // Actualizar tabs
    document.querySelectorAll('.module-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-module="${module}"]`).classList.add('active');
    
    // Mostrar contenido del módulo
    document.querySelectorAll('.module-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${module}-module`).classList.add('active');
    
    // Cargar datos del módulo
    if (module === 'libros') {
        loadLibros();
    } else {
        loadCalificaciones();
    }
}

// Autenticación
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Por favor, complete todos los campos');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        const displayName = currentUser.nombre || currentUser.username;
        document.getElementById('user-display').textContent = `Usuario: ${displayName}`;
            showAdmin();
            createLocalNotification('Bienvenido', `Hola ${displayName}, has iniciado sesión correctamente.`, 'sistema');
        } else {
            alert(data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        if (!isOnline) {
            currentUser = { username, id: Date.now() };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('user-display').textContent = `Usuario: ${username} (Offline)`;
            showAdmin();
        } else {
            alert('Error al conectar con el servidor. Verifique su conexión.');
        }
    }
}

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        const displayName = currentUser.nombre || currentUser.username;
        document.getElementById('user-display').textContent = `Usuario: ${displayName}`;
        showAdmin();
    } else {
        showLanding();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    stopNotificationPolling();
    showLanding();
}

// ========== CRUD DE LIBROS ==========

async function loadLibros(forceReload = false) {
    const realmenteOnline = navigator.onLine;
    
    if (realmenteOnline && isOnline) {
        try {
            if (!forceReload) {
                await syncPendingOperations();
            }
            
            const cacheBuster = `?t=${Date.now()}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${API_BASE_URL}/libros.php${cacheBuster}`, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.libros && Array.isArray(data.libros)) {
                libros = data.libros;
                await syncToIndexedDB('libros', libros);
                renderLibros();
            } else {
                throw new Error('Formato de respuesta inválido del servidor');
            }
        } catch (error) {
            console.error('Error al cargar desde servidor:', error);
            isOnline = false;
            await loadFromIndexedDB('libros');
        }
    } else {
        isOnline = false;
        await loadFromIndexedDB('libros');
    }
}

async function loadFromIndexedDB(storeName) {
    await ensureDBReady();
    
    if (!window.db) {
        if (storeName === 'libros') {
            libros = [];
            renderLibros();
        } else {
            calificaciones = [];
            renderCalificaciones();
        }
        return Promise.resolve([]);
    }
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = window.db.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const data = request.result || [];
                if (storeName === 'libros') {
                    libros = data;
                    renderLibros();
                } else {
                    calificaciones = data;
                    renderCalificaciones();
                }
                resolve(data);
            };

            request.onerror = () => {
                console.error(`Error al cargar ${storeName} desde IndexedDB`);
                if (storeName === 'libros') {
                    libros = [];
                    renderLibros();
                } else {
                    calificaciones = [];
                    renderCalificaciones();
                }
                resolve([]);
            };
        } catch (error) {
            console.error('Error al crear transacción:', error);
            resolve([]);
        }
    });
}

async function syncToIndexedDB(storeName, data) {
    await ensureDBReady();
    
    if (!window.db) {
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = window.db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
        
        const clearRequest = objectStore.clear();
        
        clearRequest.onsuccess = () => {
            let completed = 0;
                const total = data.length;
            
            if (total === 0) {
                resolve();
                return;
            }
            
                data.forEach(item => {
                    const addRequest = objectStore.add(item);
                addRequest.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
                addRequest.onerror = () => {
                        console.error(`Error al agregar ${storeName} a IndexedDB`);
                };
            });
        };

        clearRequest.onerror = () => {
            reject(clearRequest.error);
        };
        } catch (error) {
            reject(error);
        }
    });
}

async function saveLibro(event) {
    event.preventDefault();

    const libro = {
        titulo: document.getElementById('titulo').value,
        autor: document.getElementById('autor').value,
        fechaPublicacion: document.getElementById('fechaPublicacion').value,
        resena: document.getElementById('resena').value
    };

    // Manejar portada si existe
    const portadaInput = document.getElementById('portada');
    if (portadaInput.files && portadaInput.files[0]) {
        const file = portadaInput.files[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
            libro.portada = e.target.result;
            await processLibroSave(libro);
        };
        reader.readAsDataURL(file);
    } else {
        await processLibroSave(libro);
    }
}

async function processLibroSave(libro) {
    if (editingLibroId) {
        libro.idLibro = editingLibroId;
        await updateLibro(libro);
    } else {
        await createLibro(libro);
    }
    closeLibroModal();
}

async function createLibro(libro) {
    if (isOnline) {
        try {
            const response = await fetch(`${API_BASE_URL}/libros.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(libro)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                libro.idLibro = data.id;
                libros.push({...libro});
                renderLibros();
                await loadLibros(true);
                await broadcastNotification('Libro Creado', `El libro "${libro.titulo}" ha sido creado exitosamente.`, 'libros');
            } else {
                throw new Error(data.error || 'Error al crear libro');
            }
        } catch (error) {
            console.error('Error al crear en servidor:', error);
            const tempId = Date.now();
            libro.idLibro = tempId;
            libros.push(libro);
            renderLibros();
            await saveToIndexedDB('libros', libro);
            await addPendingOperation('CREATE', 'libros', libro);
            alert('Libro guardado localmente. Se sincronizará cuando haya conexión.');
        }
    } else {
        const tempId = Date.now();
        libro.idLibro = tempId;
        libros.push(libro);
        renderLibros();
        await saveToIndexedDB('libros', libro);
        await addPendingOperation('CREATE', 'libros', libro);
        alert('Libro guardado localmente. Se sincronizará cuando haya conexión.');
    }
}

async function updateLibro(libro) {
    if (isOnline) {
        try {
            const response = await fetch(`${API_BASE_URL}/libros.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(libro)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await updateInIndexedDB('libros', libro);
                await loadLibros(true);
                await broadcastNotification('Libro Actualizado', `El libro "${libro.titulo}" ha sido actualizado exitosamente.`, 'libros');
                    } else {
                throw new Error(data.error || 'Error al actualizar libro');
            }
        } catch (error) {
            console.error('Error al actualizar en servidor:', error);
            await updateInIndexedDB('libros', libro);
            await addPendingOperation('UPDATE', 'libros', libro);
            alert('Cambios guardados localmente. Se sincronizarán cuando haya conexión.');
        }
    } else {
        await updateInIndexedDB('libros', libro);
        await addPendingOperation('UPDATE', 'libros', libro);
        alert('Cambios guardados localmente. Se sincronizarán cuando haya conexión.');
    }
}

async function deleteLibro(id) {
    if (!confirm('¿Está seguro de que desea eliminar este libro? También se eliminarán sus calificaciones.')) {
        return;
    }

    const libro = libros.find(l => l.idLibro === id);
    libros = libros.filter(l => l.idLibro !== id);
    renderLibros();

    if (isOnline) {
        try {
            const response = await fetch(`${API_BASE_URL}/libros.php?id=${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await deleteFromIndexedDB('libros', id);
                await loadLibros(true);
                const mensaje = libro ? `El libro "${libro.titulo}" ha sido eliminado.` : 'Se eliminó un libro.';
                await broadcastNotification('Libro Eliminado', mensaje, 'libros');
            } else {
                throw new Error(data.error || 'Error al eliminar libro');
            }
        } catch (error) {
            console.error('Error al eliminar en servidor:', error);
            await addPendingOperation('DELETE', 'libros', { idLibro: id });
            await syncToIndexedDB('libros', libros);
            alert('Libro eliminado localmente. Se sincronizará cuando haya conexión.');
        }
    } else {
        await deleteFromIndexedDB('libros', id);
        await addPendingOperation('DELETE', 'libros', { idLibro: id });
        await syncToIndexedDB('libros', libros);
        alert('Libro eliminado localmente. Se sincronizará cuando haya conexión.');
    }
}

function renderLibros() {
    const tbody = document.getElementById('libros-tbody');
    const emptyState = document.getElementById('empty-libros');
    
    if (!tbody) return;
    
    if (libros.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    
    const html = libros.map(libro => {
        const fecha = new Date(libro.fechaPublicacion).toLocaleDateString('es-ES');
        const resenaCorta = libro.resena.length > 100 ? libro.resena.substring(0, 100) + '...' : libro.resena;
        return `
        <tr>
            <td>${libro.idLibro}</td>
            <td><strong>${libro.titulo || ''}</strong></td>
            <td>${libro.autor || ''}</td>
            <td>${fecha}</td>
            <td>${resenaCorta}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editLibro(${libro.idLibro})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                    </button>
                    <button class="btn-delete" onclick="deleteLibro(${libro.idLibro})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
    
    tbody.innerHTML = html;
}

function filterLibros() {
    const searchTerm = document.getElementById('search-libros').value.toLowerCase();
    const filtered = libros.filter(libro => 
        libro.titulo.toLowerCase().includes(searchTerm) ||
        libro.autor.toLowerCase().includes(searchTerm) ||
        libro.resena.toLowerCase().includes(searchTerm)
    );

    const tbody = document.getElementById('libros-tbody');
    const emptyState = document.getElementById('empty-libros');
    
    if (filtered.length === 0 && searchTerm) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No se encontraron resultados</td></tr>';
        emptyState.style.display = 'none';
        return;
    }

    if (filtered.length === 0) {
        renderLibros();
        return;
    }

    emptyState.style.display = 'none';
    const fecha = (f) => new Date(f).toLocaleDateString('es-ES');
    const resenaCorta = (r) => r.length > 100 ? r.substring(0, 100) + '...' : r;
    tbody.innerHTML = filtered.map(libro => `
        <tr>
            <td>${libro.idLibro}</td>
            <td><strong>${libro.titulo}</strong></td>
            <td>${libro.autor}</td>
            <td>${fecha(libro.fechaPublicacion)}</td>
            <td>${resenaCorta(libro.resena)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editLibro(${libro.idLibro})">Editar</button>
                    <button class="btn-delete" onclick="deleteLibro(${libro.idLibro})">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openLibroModal(id = null) {
    editingLibroId = id;
    const modal = document.getElementById('libro-modal');
    const form = document.getElementById('libro-form');
    const title = document.getElementById('libro-modal-title');

    if (id) {
        const libro = libros.find(l => l.idLibro === id);
        if (libro) {
            title.textContent = 'Editar Libro';
            document.getElementById('libro-id').value = libro.idLibro;
            document.getElementById('titulo').value = libro.titulo;
            document.getElementById('autor').value = libro.autor;
            document.getElementById('fechaPublicacion').value = libro.fechaPublicacion;
            document.getElementById('resena').value = libro.resena;
            document.getElementById('portada-preview').style.display = 'none';
        }
    } else {
        title.textContent = 'Nuevo Libro';
        form.reset();
        document.getElementById('libro-id').value = '';
        document.getElementById('portada-preview').style.display = 'none';
    }

    modal.classList.add('active');
}

function closeLibroModal() {
    const modal = document.getElementById('libro-modal');
    modal.classList.remove('active');
    editingLibroId = null;
    document.getElementById('libro-form').reset();
    document.getElementById('portada-preview').style.display = 'none';
}

function editLibro(id) {
    openLibroModal(id);
}

function handlePortadaChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('portada-img').src = e.target.result;
            document.getElementById('portada-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// ========== CRUD DE CALIFICACIONES ==========

async function loadCalificaciones(forceReload = false) {
    const realmenteOnline = navigator.onLine;
    
    if (realmenteOnline && isOnline) {
        try {
            if (!forceReload) {
                await syncPendingOperations();
            }
            
                const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${API_BASE_URL}/calificaciones.php${cacheBuster}`, {
                    method: 'GET',
                    cache: 'no-store',
                    headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.calificaciones && Array.isArray(data.calificaciones)) {
                calificaciones = data.calificaciones;
                await syncToIndexedDB('calificaciones', calificaciones);
                renderCalificaciones();
            }
        } catch (error) {
            console.error('Error al cargar desde servidor:', error);
            isOnline = false;
            await loadFromIndexedDB('calificaciones');
        }
    } else {
        isOnline = false;
        await loadFromIndexedDB('calificaciones');
    }
}

async function saveCalificacion(event) {
    event.preventDefault();

    const calificacion = {
        idLibro: parseInt(document.getElementById('calificacion-libro').value),
        calificacion: parseInt(document.getElementById('calificacion-valor').value),
        resena: document.getElementById('calificacion-resena').value
    };

    if (editingCalificacionId) {
        calificacion.idCalificacion = editingCalificacionId;
        await updateCalificacion(calificacion);
                        } else {
        await createCalificacion(calificacion);
    }
    closeCalificacionModal();
}

async function createCalificacion(calificacion) {
    if (isOnline) {
        try {
            const response = await fetch(`${API_BASE_URL}/calificaciones.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(calificacion)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                calificacion.idCalificacion = data.id;
                calificaciones.push({...calificacion});
                renderCalificaciones();
                await loadCalificaciones(true);
                const libro = libros.find(l => l.idLibro === calificacion.idLibro);
                await broadcastNotification('Calificación Creada', `Se ha creado una nueva calificación para "${libro ? libro.titulo : 'un libro'}".`, 'calificaciones');
            } else {
                throw new Error(data.error || 'Error al crear calificación');
            }
        } catch (error) {
            console.error('Error al crear en servidor:', error);
            const tempId = Date.now();
            calificacion.idCalificacion = tempId;
            calificaciones.push(calificacion);
            renderCalificaciones();
            await saveToIndexedDB('calificaciones', calificacion);
            await addPendingOperation('CREATE', 'calificaciones', calificacion);
            alert('Calificación guardada localmente. Se sincronizará cuando haya conexión.');
        }
    } else {
        const tempId = Date.now();
        calificacion.idCalificacion = tempId;
        calificaciones.push(calificacion);
        renderCalificaciones();
        await saveToIndexedDB('calificaciones', calificacion);
        await addPendingOperation('CREATE', 'calificaciones', calificacion);
        alert('Calificación guardada localmente. Se sincronizará cuando haya conexión.');
    }
}

async function updateCalificacion(calificacion) {
    if (isOnline) {
        try {
            const response = await fetch(`${API_BASE_URL}/calificaciones.php`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(calificacion)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await updateInIndexedDB('calificaciones', calificacion);
                await loadCalificaciones(true);
                const libro = libros.find(l => l.idLibro === calificacion.idLibro);
                await broadcastNotification('Calificación Actualizada', `Se ha actualizado una calificación para "${libro ? libro.titulo : 'un libro'}".`, 'calificaciones');
            } else {
                throw new Error(data.error || 'Error al actualizar calificación');
            }
        } catch (error) {
            console.error('Error al actualizar en servidor:', error);
            await updateInIndexedDB('calificaciones', calificacion);
            await addPendingOperation('UPDATE', 'calificaciones', calificacion);
            alert('Cambios guardados localmente. Se sincronizarán cuando haya conexión.');
        }
    } else {
        await updateInIndexedDB('calificaciones', calificacion);
        await addPendingOperation('UPDATE', 'calificaciones', calificacion);
        alert('Cambios guardados localmente. Se sincronizarán cuando haya conexión.');
    }
}

async function deleteCalificacion(id) {
    if (!confirm('¿Está seguro de que desea eliminar esta calificación?')) {
        return;
    }

    const calif = calificaciones.find(c => c.idCalificacion === id);
    calificaciones = calificaciones.filter(c => c.idCalificacion !== id);
    renderCalificaciones();

    if (isOnline) {
        try {
            const response = await fetch(`${API_BASE_URL}/calificaciones.php?id=${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await deleteFromIndexedDB('calificaciones', id);
                await loadCalificaciones(true);
                const libro = libros.find(l => l.idLibro === (calif ? calif.idLibro : null));
                await broadcastNotification('Calificación Eliminada', `Se eliminó una calificación para "${libro ? libro.titulo : 'un libro'}".`, 'calificaciones');
            } else {
                throw new Error(data.error || 'Error al eliminar calificación');
            }
        } catch (error) {
            console.error('Error al eliminar en servidor:', error);
            await addPendingOperation('DELETE', 'calificaciones', { idCalificacion: id });
            await syncToIndexedDB('calificaciones', calificaciones);
            alert('Calificación eliminada localmente. Se sincronizará cuando haya conexión.');
        }
    } else {
        await deleteFromIndexedDB('calificaciones', id);
        await addPendingOperation('DELETE', 'calificaciones', { idCalificacion: id });
        await syncToIndexedDB('calificaciones', calificaciones);
        alert('Calificación eliminada localmente. Se sincronizará cuando haya conexión.');
    }
}

function renderCalificaciones() {
    const tbody = document.getElementById('calificaciones-tbody');
    const emptyState = document.getElementById('empty-calificaciones');
    
    if (!tbody) return;
    
    if (calificaciones.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    
    const html = calificaciones.map(calif => {
        const estrellas = '★'.repeat(calif.calificacion) + '☆'.repeat(5 - calif.calificacion);
        return `
        <tr>
            <td>${calif.idCalificacion}</td>
            <td>${calif.libroTitulo || 'N/A'}</td>
            <td><span style="color: #fbbf24;">${estrellas}</span> (${calif.calificacion}/5)</td>
            <td>${calif.resena.length > 100 ? calif.resena.substring(0, 100) + '...' : calif.resena}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editCalificacion(${calif.idCalificacion})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Editar
                    </button>
                    <button class="btn-delete" onclick="deleteCalificacion(${calif.idCalificacion})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
    
    tbody.innerHTML = html;
}

function filterCalificaciones() {
    const searchTerm = document.getElementById('search-calificaciones').value.toLowerCase();
    const filtered = calificaciones.filter(calif => 
        (calif.libroTitulo || '').toLowerCase().includes(searchTerm) ||
        calif.resena.toLowerCase().includes(searchTerm) ||
        calif.calificacion.toString().includes(searchTerm)
    );

    const tbody = document.getElementById('calificaciones-tbody');
    const emptyState = document.getElementById('empty-calificaciones');
    
    if (filtered.length === 0 && searchTerm) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No se encontraron resultados</td></tr>';
        emptyState.style.display = 'none';
        return;
    }

    if (filtered.length === 0) {
        renderCalificaciones();
        return;
    }

    emptyState.style.display = 'none';
    const estrellas = (c) => '★'.repeat(c) + '☆'.repeat(5 - c);
    tbody.innerHTML = filtered.map(calif => `
        <tr>
            <td>${calif.idCalificacion}</td>
            <td>${calif.libroTitulo || 'N/A'}</td>
            <td><span style="color: #fbbf24;">${estrellas(calif.calificacion)}</span> (${calif.calificacion}/5)</td>
            <td>${calif.resena.length > 100 ? calif.resena.substring(0, 100) + '...' : calif.resena}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editCalificacion(${calif.idCalificacion})">Editar</button>
                    <button class="btn-delete" onclick="deleteCalificacion(${calif.idCalificacion})">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openCalificacionModal(id = null) {
    editingCalificacionId = id;
    const modal = document.getElementById('calificacion-modal');
    const form = document.getElementById('calificacion-form');
    const title = document.getElementById('calificacion-modal-title');
    const libroSelect = document.getElementById('calificacion-libro');

    // Cargar libros en el select
    libroSelect.innerHTML = '<option value="">Seleccione un libro</option>';
    libros.forEach(libro => {
        const option = document.createElement('option');
        option.value = libro.idLibro;
        option.textContent = libro.titulo;
        libroSelect.appendChild(option);
    });

    if (id) {
        const calif = calificaciones.find(c => c.idCalificacion === id);
        if (calif) {
            title.textContent = 'Editar Calificación';
            document.getElementById('calificacion-id').value = calif.idCalificacion;
            document.getElementById('calificacion-libro').value = calif.idLibro;
            document.getElementById('calificacion-valor').value = calif.calificacion;
            document.getElementById('calificacion-resena').value = calif.resena;
        }
    } else {
        title.textContent = 'Nueva Calificación';
        form.reset();
        document.getElementById('calificacion-id').value = '';
    }

    modal.classList.add('active');
}

function closeCalificacionModal() {
    const modal = document.getElementById('calificacion-modal');
    modal.classList.remove('active');
    editingCalificacionId = null;
    document.getElementById('calificacion-form').reset();
}

function editCalificacion(id) {
    openCalificacionModal(id);
}

// Operaciones con IndexedDB
async function saveToIndexedDB(storeName, item) {
    await ensureDBReady();
    if (!window.db) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = window.db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (error) {
            resolve();
        }
    });
}

async function updateInIndexedDB(storeName, item) {
    return saveToIndexedDB(storeName, item);
}

async function deleteFromIndexedDB(storeName, id) {
    await ensureDBReady();
    if (!window.db) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = window.db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (error) {
            resolve();
        }
    });
}

// Gestión de operaciones pendientes
async function addPendingOperation(operation, module, data) {
    await ensureDBReady();
    if (!window.db) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = window.db.transaction(['pending_operations'], 'readwrite');
            const objectStore = transaction.objectStore('pending_operations');
            const request = objectStore.add({ 
                operation, 
                module,
                data, 
                timestamp: Date.now() 
            });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (error) {
            resolve();
        }
    });
}

async function syncPendingOperations() {
    if (!isOnline) return;
    
    await ensureDBReady();
    if (!window.db) return Promise.resolve();

    return new Promise((resolve, reject) => {
        try {
            const transaction = window.db.transaction(['pending_operations'], 'readonly');
            const objectStore = transaction.objectStore('pending_operations');
            const request = objectStore.getAll();

        request.onsuccess = async () => {
            const operations = request.result || [];
            let synced = false;
            
            for (const op of operations) {
                try {
                    let response;
                        const endpoint = op.module === 'libros' ? 'libros.php' : 'calificaciones.php';
                        
                    switch (op.operation) {
                        case 'CREATE':
                                response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(op.data)
                            });
                            break;
                        case 'UPDATE':
                                response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(op.data)
                            });
                            break;
                        case 'DELETE':
                                const idField = op.module === 'libros' ? 'idLibro' : 'idCalificacion';
                                response = await fetch(`${API_BASE_URL}/${endpoint}?id=${op.data[idField]}`, {
                                method: 'DELETE'
                            });
                            break;
                    }

                    if (response && response.ok) {
                        await removePendingOperation(op.id);
                        synced = true;
                    }
                } catch (error) {
                    console.error('Error al sincronizar operación:', error);
                }
            }

            if (synced) {
                    if (currentModule === 'libros') {
                        await loadLibros(true);
                    } else {
                        await loadCalificaciones(true);
                }
            }
            resolve();
        };

        request.onerror = () => reject(request.error);
        } catch (error) {
            resolve();
        }
    });
}

async function removePendingOperation(id) {
    await ensureDBReady();
    if (!window.db) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = window.db.transaction(['pending_operations'], 'readwrite');
            const objectStore = transaction.objectStore('pending_operations');
            const request = objectStore.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (error) {
            resolve();
        }
    });
}

// ========== NOTIFICACIONES ==========

async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
    }
}

function createLocalNotification(title, body, module = 'general', options = {}) {
    const notification = {
        id: options.id || Date.now(),
        titulo: title,
        mensaje: body,
        modulo: module,
        usuario: options.usuario || (currentUser ? (currentUser.username || 'sistema') : 'sistema'),
        created_at: options.timestamp || new Date().toISOString()
    };
    handleIncomingNotification(notification, { fromServer: false, skipSystem: !!options.skipSystem });
}

function showSystemNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: './icon.svg',
            badge: './icon.svg'
        });
    }

    if (swRegistration && swRegistration.active) {
        swRegistration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            body
        });
    }
}

async function broadcastNotification(title, body, module = 'general') {
    if (!isOnline || !currentUser) {
        createLocalNotification(title, body, module);
        return;
    }

    const payload = {
        titulo: title,
        mensaje: body,
        modulo: module,
        usuario: currentUser.username || 'sistema'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success && data.notification) {
            handleIncomingNotification(data.notification, { fromServer: true });
        } else {
            throw new Error(data.error || 'Error al crear notificación');
        }
    } catch (error) {
        console.error('Error al enviar notificación al servidor:', error);
        createLocalNotification(title, body, module);
    }
}

function handleIncomingNotification(notification, options = {}) {
    if (!notification) return;

    const id = Number(notification.id) || Date.now();
    if (notificationCache.has(id) && !options.force) {
        return;
    }

    notificationCache.add(id);

    const title = notification.titulo || notification.title || 'Notificación';
    const body = notification.mensaje || notification.body || '';
    const module = notification.modulo || notification.module || 'general';
    const usuario = notification.usuario || notification.username || 'sistema';
    const timestamp = notification.created_at || notification.timestamp || new Date().toISOString();

    if (options.fromServer && id > lastNotificationId) {
        lastNotificationId = id;
    }

    addNotification(title, body, {
        id,
        timestamp,
        module,
        usuario,
        skipPersist: options.skipPersist
    });

    if (!options.skipSystem) {
        showSystemNotification(title, body);
    }
}

function addNotification(title, body, options = {}) {
    const notification = {
        id: options.id || Date.now(),
        title,
        body,
        module: options.module || 'general',
        usuario: options.usuario || (currentUser ? (currentUser.username || 'sistema') : 'sistema'),
        timestamp: options.timestamp || new Date().toISOString()
    };

    if (!options.skipPersist) {
        saveNotificationToDB(notification);
    }

    updateNotificationsUI();
    updateNotificationBadge();
    return notification;
}

async function saveNotificationToDB(notification) {
    await ensureDBReady();
    if (!window.db) return;

    return new Promise((resolve) => {
        try {
            const transaction = window.db.transaction(['notifications'], 'readwrite');
            const objectStore = transaction.objectStore('notifications');
            const request = objectStore.put(notification);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        } catch (error) {
            resolve();
        }
    });
}

async function loadNotifications() {
    await ensureDBReady();
    if (!window.db) return [];

    return new Promise((resolve) => {
        try {
            const transaction = window.db.transaction(['notifications'], 'readonly');
            const objectStore = transaction.objectStore('notifications');
            const request = objectStore.getAll();
            request.onsuccess = () => {
                const notifications = (request.result || []).sort((a, b) => {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                resolve(notifications);
            };
            request.onerror = () => resolve([]);
        } catch (error) {
            resolve([]);
        }
    });
}

function showNotifications() {
    const panel = document.getElementById('notifications-panel');
    panel.classList.add('active');
    updateNotificationsUI();
}

function closeNotifications() {
    const panel = document.getElementById('notifications-panel');
    panel.classList.remove('active');
}

async function updateNotificationsUI() {
    const list = document.getElementById('notifications-list');
    const notifications = await loadNotifications();

    if (notifications.length === 0) {
        list.innerHTML = '<div class="notification-empty">No hay notificaciones</div>';
        return;
    }

    list.innerHTML = notifications.map(notif => {
        const date = new Date(notif.timestamp);
        const meta = `${(notif.module || 'General').toUpperCase()} • ${notif.usuario || 'sistema'}`;
        return `
            <div class="notification-item">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-meta">${meta}</div>
                <div class="notification-body">${notif.body}</div>
                <div class="notification-time">${date.toLocaleString('es-ES')}</div>
            </div>
        `;
    }).join('');
}

function updateNotificationBadge() {
    loadNotifications().then(notifications => {
        const badge = document.getElementById('notification-badge');
        if (notifications.length > 0) {
            badge.textContent = notifications.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

async function startNotificationPolling() {
    if (notificationPoller || !currentUser) return;
    await fetchServerNotifications(true);
    notificationPoller = setInterval(() => fetchServerNotifications(false), 6000);
}

function stopNotificationPolling() {
    if (notificationPoller) {
        clearInterval(notificationPoller);
        notificationPoller = null;
    }
    lastNotificationId = 0;
    notificationCache.clear();
}

async function fetchServerNotifications(skipSystem = false) {
    if (!isOnline || !currentUser) return;
    try {
        const response = await fetch(`${API_BASE_URL}/notificaciones.php?last_id=${lastNotificationId}`);
        const data = await response.json();

        if (response.ok && data.notificaciones && Array.isArray(data.notificaciones)) {
            data.notificaciones.forEach(notif => {
                handleIncomingNotification({
                    id: notif.id,
                    titulo: notif.titulo,
                    mensaje: notif.mensaje,
                    modulo: notif.modulo,
                    usuario: notif.usuario,
                    created_at: notif.created_at
                }, { fromServer: true, skipSystem });
            });
        }
    } catch (error) {
        console.error('Error al obtener notificaciones del servidor:', error);
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    const libroModal = document.getElementById('libro-modal');
    const califModal = document.getElementById('calificacion-modal');
    if (e.target === libroModal) {
        closeLibroModal();
    }
    if (e.target === califModal) {
        closeCalificacionModal();
    }
});

// Cargar notificaciones al iniciar
setInterval(updateNotificationBadge, 5000);
