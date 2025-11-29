📚 Biblioteca PWA

Aplicación Web Progresiva (PWA) con soporte offline, CRUD, autenticación, IndexedDB, Service Worker y Notificaciones Push.

🚀 Descripción del Proyecto

Biblioteca PWA es una aplicación diseñada para gestionar libros, usuarios, calificaciones y notificaciones dentro de un entorno web moderno.
Soporta funcionamiento sin conexión, envío de notificaciones push, almacenamiento local con IndexedDB y sincronización con un servidor mediante APIs en PHP.

Este proyecto demuestra el uso de:

Service Worker

Manejo de caché

Modo offline

Push Notifications

REST API con PHP y MySQL

CRUD

Manejo de sesión

Manifest e instalación como PWA

📌 Características Principales
1. PWA con modo offline

Cache First para archivos estáticos

Network First para API

Fallback offline

Background Sync (estructura preparada)

2. Notificaciones Push

Recepción de notificaciones en segundo plano

Manejo del evento push

Vibración, iconos e interacciones

Integración con tokens de usuario

3. CRUD completo

Módulos:

Libros

Usuarios

Calificaciones

Notificaciones

4. Autenticación

Login con verificación desde API

Sesión persistente en el navegador

5. IndexedDB

Almacenamiento local de libros y calificaciones

Consultas sin internet

Sincronización cuando vuelve la conexión

🗂️ Estructura del Proyecto
📁 raiz/
│── index.html
│── app.js
│── styles.css
│── manifest.json
│── sw.js
│── icon.svg
│
└── 📁 api/
      ├── login.php
      ├── libros.php
      ├── calificaciones.php
      └── notificaciones.php

⚙️ Instalación
1. Clonar el proyecto
git clone https://github.com/tu-repo/biblioteca-pwa.git

2. Configurar la base de datos en /api/config.php
define("DB_HOST", "localhost");
define("DB_USER", "root");
define("DB_PASS", "");
define("DB_NAME", "biblioteca");

3. Servir el proyecto desde un servidor

Requerido para que el Service Worker funcione:

XAMPP

WAMP

MAMP

Apache / Nginx

Render / Vercel / Netlify

🛠️ Tecnologías Utilizadas
Tecnología	Función
HTML / CSS / JS	Interfaz y lógica
IndexedDB	Almacenamiento offline
Service Worker	Cache, sync y push
PHP	Backend
MySQL	Base de datos
Push API	Notificaciones
PWA	Instalación y modo offline
🔔 Notificaciones Push

El archivo sw.js maneja:

Recepción de push mediante self.addEventListener('push')

Mostrar notificaciones incluso con la app cerrada

Vibración, iconos y badge

Evento notificationclick para abrir la app

Ejemplo del manejador:

self.addEventListener('push', (event) => {
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: './icon.svg',
            badge: './icon.svg'
        })
    );
});

📡 API REST (PHP)
/api/notificaciones.php

Funciones implementadas:

Obtener notificaciones

Crear nuevas notificaciones

Integración con tokens push

Ejemplo de payload:

{
  "titulo": "Nuevo libro",
  "mensaje": "Se agregó un nuevo libro",
  "modulo": "Libros",
  "usuario": "admin"
}

📦 Manifest

El archivo manifest.json permite:

Instalar la app

Mostrar iconos

Definir tema

Habilitar pantalla de inicio

📲 Instalación como App

El navegador muestra el botón “Instalar” porque:

La app tiene un manifest válido

El Service Worker está activo

Se sirve por HTTPS o localhost

🧪 Pruebas en modo Offline

Cargar la app

Activar el modo offline en DevTools

La app sigue funcionando:

Archivos cargados desde caché

Datos en IndexedDB

Fallback a index.html si falla una vista

📘 Licencia

Proyecto académico. Libre para uso educativo o personal.

👤 Autor

Proyecto desarrollado por Enrique Tapia.
