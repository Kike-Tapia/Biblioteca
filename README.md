# Sistema de Gestión de Departamentos - PWA

Aplicación Web Progresiva (PWA) para la gestión de departamentos con funcionalidad offline y conexión a base de datos MySQL en XAMPP.

## Características

✅ **Landing Page personalizada** con diseño moderno y atractivo
✅ **Sistema de Login** con autenticación local
✅ **Módulo de Departamentos** con operaciones CRUD completas:
   - **CREATE**: Crear nuevos departamentos
   - **READ**: Leer y listar departamentos
   - **UPDATE**: Editar departamentos existentes
   - **DELETE**: Eliminar departamentos
✅ **Almacenamiento Local**: 
   - IndexedDB para operaciones CRUD principales
   - localStorage para respaldo automático
✅ **Funcionamiento Offline** mediante Service Worker
✅ **Iconos y colores personalizados** con tema único

## Estructura de la Base de Datos

La tabla `departamentos` contiene los siguientes campos:
- `id` (int, auto_increment, primary key)
- `direccion` (varchar)
- `numero` (int)
- `descripcion` (varchar)
- `estado` (varchar) - Valores: Disponible, Ocupado, Mantenimiento, Reservado

## Instalación y Uso

### Requisitos
- **XAMPP** instalado y funcionando
- Apache y MySQL deben estar activos
- Navegador web moderno

### Pasos para ejecutar:

1. **Configurar XAMPP**
   - Iniciar Apache y MySQL desde el Panel de Control de XAMPP

2. **Crear la base de datos**
   - Abrir phpMyAdmin: `http://localhost/phpmyadmin`
   - Ejecutar el script `database.sql` para crear la base de datos y tabla
   - O importar directamente el archivo `database.sql`

3. **Configurar el proyecto**
   - Copiar la carpeta del proyecto a `C:\xampp\htdocs\ExamPracticoAWP`
   - Verificar las credenciales en `config.php` (por defecto: usuario `root`, sin contraseña)

4. **Acceder a la aplicación**
   - Abrir en el navegador: `http://localhost/ExamPracticoAWP`
   - La aplicación se conectará a MySQL cuando haya conexión
   - Funciona offline usando IndexedDB como respaldo

**Ver guía detallada en `INSTALACION.md`**

### Generar Iconos PNG (Opcional)

Para una mejor experiencia PWA, se recomienda generar iconos PNG desde el SVG:

1. Abrir `icon.svg` en un editor de imágenes
2. Exportar como PNG en tamaños 192x192 y 512x512
3. Guardar como `icon-192.png` y `icon-512.png` en la raíz del proyecto

O usar herramientas online como:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Funcionalidades Implementadas

### Landing Page
- Diseño atractivo con gradientes y animaciones
- Información sobre las características de la aplicación
- Botón para iniciar sesión

### Login
- Autenticación simple (usuario y contraseña)
- Persistencia de sesión en localStorage
- Navegación fluida entre páginas

### Gestión de Departamentos

#### CREATE (Crear)
- Formulario modal para crear nuevos departamentos
- Validación de campos requeridos
- Almacenamiento en IndexedDB

#### READ (Leer)
- Tabla con todos los departamentos
- Búsqueda en tiempo real
- Estados visuales con badges de colores
- Estado vacío cuando no hay datos

#### UPDATE (Actualizar)
- Edición de departamentos existentes
- Mismo formulario modal que CREATE
- Actualización en IndexedDB

#### DELETE (Eliminar)
- Eliminación con confirmación
- Borrado permanente de IndexedDB

### Conexión a Base de Datos MySQL

- **Backend PHP** con endpoints REST para operaciones CRUD
- **Sincronización automática** entre MySQL e IndexedDB
- **Modo offline**: Los cambios se guardan localmente y se sincronizan cuando hay conexión
- **Base de datos**: `departamentos_db` en MySQL/XAMPP

### Almacenamiento Local

#### IndexedDB (Respaldo Offline)
- Sincronización automática con MySQL
- Base de datos: `DepartamentosDB`
- Object Store: `departamentos` y `pending_operations`
- Se usa cuando no hay conexión a internet

#### localStorage
- Respaldo automático después de cada operación
- Función `backupToLocalStorage()` se ejecuta automáticamente
- Función `restoreFromLocalStorage()` disponible para restauración manual

### Service Worker
- Cache de todos los recursos estáticos
- Estrategia Cache First
- Funcionamiento completo sin conexión
- Actualización automática de cache

## Personalización

### Colores
Los colores están definidos en `styles.css` usando variables CSS:
- `--primary-color`: #6366f1 (Índigo)
- `--secondary-color`: #fbbf24 (Amarillo)
- `--success-color`: #10b981 (Verde)
- `--danger-color`: #ef4444 (Rojo)

### Iconos
- Iconos SVG personalizados en toda la aplicación
- Logo principal en landing page
- Iconos de acción en botones
- Iconos de estado en badges

## Navegadores Compatibles

- Chrome/Edge (recomendado)
- Firefox
- Safari (iOS 11.3+)
- Opera

## Notas Técnicas

- La aplicación funciona completamente offline después de la primera carga
- Los datos persisten en IndexedDB del navegador
- El Service Worker se registra automáticamente
- La autenticación es simple (sin backend) para demostración

## Estructura de Archivos

```
ExamPracticoAWP/
├── index.html          # Página principal (landing, login, módulo)
├── styles.css          # Estilos personalizados
├── app.js              # Lógica de la aplicación (conectado a PHP)
├── sw.js               # Service Worker
├── manifest.json       # Configuración PWA
├── icon.svg            # Icono SVG
├── config.php          # Configuración de conexión a MySQL
├── database.sql        # Script SQL para crear base de datos
├── api/
│   ├── departamentos.php  # Endpoints CRUD para departamentos
│   └── login.php          # Endpoint de autenticación
├── INSTALACION.md      # Guía detallada de instalación
└── README.md           # Este archivo
```

## Evaluación de Requisitos

✅ Iconos y colores personalizados
✅ Landing page personalizada
✅ Login funcional
✅ 1 Módulo con 3+ funciones CRUD (CREATE, READ, UPDATE, DELETE)
✅ 1 función CRUD con localStorage (backup automático)
✅ Funcionar sin conexión (Service Worker)

---

Desarrollado como aplicación web progresiva para gestión de departamentos.

