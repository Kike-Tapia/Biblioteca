📚 Biblioteca PWA

Aplicación Web Progresiva (PWA) con soporte offline, CRUD, autenticación, IndexedDB, Service Worker y Notificaciones Push.

🚀 Descripción del Proyecto

Biblioteca PWA es una aplicación diseñada para gestionar libros, usuarios, calificaciones y notificaciones dentro de un entorno web moderno.
Soporta funcionamiento sin conexión, envío de notificaciones push, almacenamiento en IndexedDB y sincronización con un servidor mediante APIs en PHP.

Esta PWA fue desarrollada como parte de un proyecto académico para demostrar:

Uso de Service Worker

Manejo de caché

Funcionalidad offline

Push Notifications

REST API con PHP y MySQL

CRUD completo

Manejo de sesión sin frameworks

Manifest y archivo de instalación como App

📌 Características Principales
✅ 1. PWA con modo offline

Service Worker configurado con:

Cache First para archivos estáticos

Network First para API

Manejo de errores offline

Sincronización en segundo plano

✅ 2. Notificaciones Push

Recepción de notificaciones mediante push event

Uso de VAPID Keys / Firebase Cloud Messaging (dependiendo de implementación)

Service Worker encargado de mostrar las notificaciones

Vibración, badge, icono y acciones

✅ 3. CRUD completo

Módulos gestionados:

📘 Libros

👤 Usuarios

⭐ Calificaciones

🔔 Notificaciones (desde API)

✅ 4. Autenticación

Login sencillo mediante API

Control de acceso a módulos

Sesión persistente

✅ 5. IndexedDB

Base local para almacenar datos de libros y calificaciones

Permite consultar datos sin internet

Sincronización cuando la red vuelve

🗂️ Estructura de Archivos
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
1️⃣ Clonar el proyecto
git clone https://github.com/tu-repo/biblioteca-pwa.git

2️⃣ Configurar la API

Editar /api/config.php con los datos de tu base de datos:

define("DB_HOST", "localhost");
define("DB_USER", "root");
define("DB_PASS", "");
define("DB_NAME", "biblioteca");

3️⃣ Servidor recomendado

Para que el Service Worker funcione:

Render

XAMPP / WAMP / MAMP

Apache o Nginx

⚠️ No funciona ejecutando el HTML directamente con file://.

🛠️ Tecnologías Utilizadas
Tecnología	Uso
HTML / CSS / JS	Interfaz y lógica
IndexedDB	Base de datos offline
Service Worker	Cache, sync, notificaciones
PHP (API)	Backend y CRUD
MySQL	Almacenamiento principal
PWA (manifest + sw)	Instalación y offline
Push API	Notificaciones
🔔 Notificaciones Push

El archivo sw.js maneja:

Evento push

Evento notificationclick

Mostrar notificaciones con iconos, vibración y badge

Comunicación con la app mediante postMessage()

Ejemplo dentro del Service Worker:

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

Permite:

✔ Obtener notificaciones

✔ Crear nuevas notificaciones

✔ Integrarse con tokens de push

Ejemplo de cuerpo de notificación:

{
  "titulo": "Nuevo libro",
  "mensaje": "Se ha añadido un nuevo libro a la biblioteca",
  "modulo": "Libros",
  "usuario": "admin"
}

📦 Manifest

manifest.json permite instalar la app:

Iconos

Nombre de la app

Startup screen

Configuración de orientación

📲 Instalación como App

El navegador mostrará el botón "Instalar" automáticamente porque:

Tiene Service Worker activo

Tiene manifest válido

Se sirve por HTTPS o localhost

🧪 Modo Offline (Pruebas)

Abrir la app

Activar el modo offline del navegador

La app sigue funcionando porque:

HTML, CSS, JS están en caché

IndexedDB contiene datos guardados

La falla API no rompe la interfaz

📘 Licencia

Este proyecto es de uso académico y puede modificarse libremente.

🙌 Autor

Proyecto desarrollado por Enrique Tapia como parte de una práctica académica.
