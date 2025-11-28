# Guía de Instalación - Sistema de Gestión de Departamentos

## Requisitos Previos

- XAMPP instalado y funcionando
- Navegador web moderno (Chrome, Firefox, Edge)

## Pasos de Instalación

### 1. Configurar XAMPP

1. **Iniciar XAMPP**
   - Abrir el Panel de Control de XAMPP
   - Iniciar los servicios **Apache** y **MySQL**

2. **Verificar que los servicios estén corriendo**
   - Apache debe estar en verde
   - MySQL debe estar en verde

### 2. Crear la Base de Datos

1. **Abrir phpMyAdmin**
   - Ir a: `http://localhost/phpmyadmin`
   - O hacer clic en "Admin" junto a MySQL en el panel de XAMPP

2. **Importar la base de datos**
   - Opción A: Ejecutar el script SQL
     - Hacer clic en "Nueva" para crear una base de datos
     - Seleccionar la base de datos creada
     - Ir a la pestaña "SQL"
     - Copiar y pegar el contenido de `database.sql`
     - Hacer clic en "Continuar"
   
   - Opción B: Importar directamente
     - Hacer clic en "Importar"
     - Seleccionar el archivo `database.sql`
     - Hacer clic en "Continuar"

3. **Crear usuarios del sistema**
   - Abrir en el navegador: `http://localhost/ExamPracticoAWP/setup_users.php`
   - Este script creará automáticamente los usuarios con contraseñas hasheadas correctamente
   - **Credenciales de acceso:**
     - Usuario: `admin` / Contraseña: `admin123`
     - Usuario: `usuario` / Contraseña: `usuario123`

4. **Verificar la creación**
   - Deberías ver la base de datos `departamentos_db`
   - Deberías ver las tablas `usuarios` y `departamentos` con los campos correctos
   - Deberías ver 2 usuarios en la tabla usuarios
   - Deberías ver 3 departamentos de ejemplo en la tabla departamentos

### 3. Configurar el Proyecto

1. **Copiar archivos a htdocs**
   - Copiar toda la carpeta `ExamPracticoAWP` a:
     ```
     C:\xampp\htdocs\ExamPracticoAWP
     ```
   - O si prefieres otro nombre:
     ```
     C:\xampp\htdocs\tu-nombre-proyecto
     ```

2. **Verificar configuración de base de datos**
   - Abrir el archivo `config.php`
   - Verificar que las credenciales sean correctas:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_USER', 'root');      // Usuario por defecto de XAMPP
     define('DB_PASS', '');          // Contraseña por defecto (vacía)
     define('DB_NAME', 'departamentos_db');
     ```
   - Si cambiaste la contraseña de MySQL, actualiza `DB_PASS`

### 4. Acceder a la Aplicación

1. **Abrir en el navegador**
   - Ir a: `http://localhost/ExamPracticoAWP`
   - O: `http://localhost/ExamPracticoAWP/index.html`

2. **Verificar funcionamiento**
   - Deberías ver la landing page
   - Hacer clic en "Iniciar Sesión"
   - Ingresar las credenciales:
     - **Usuario:** `admin`
     - **Contraseña:** `admin123`
   - Deberías ver el módulo de departamentos con los 3 departamentos de ejemplo
   - Ver archivo `CREDENCIALES.md` para más información

### 5. Probar las Funcionalidades

1. **Crear un departamento**
   - Hacer clic en "Nuevo Departamento"
   - Llenar el formulario
   - Guardar
   - Verificar en phpMyAdmin que se haya creado

2. **Editar un departamento**
   - Hacer clic en "Editar" en cualquier departamento
   - Modificar los datos
   - Guardar
   - Verificar los cambios

3. **Eliminar un departamento**
   - Hacer clic en "Eliminar"
   - Confirmar
   - Verificar que se haya eliminado

4. **Probar modo offline**
   - Desconectar internet
   - Intentar crear/editar/eliminar
   - Los cambios se guardarán localmente
   - Reconectar internet
   - Los cambios se sincronizarán automáticamente

## Solución de Problemas

### Error: "Error de conexión"
- Verificar que MySQL esté corriendo en XAMPP
- Verificar las credenciales en `config.php`
- Verificar que la base de datos `departamentos_db` exista

### Error: "Access denied for user"
- Verificar el usuario y contraseña en `config.php`
- Si cambiaste la contraseña de MySQL, actualízala en `config.php`

### Error: "Table doesn't exist"
- Ejecutar el script `database.sql` en phpMyAdmin
- Verificar que la tabla `departamentos` exista

### La aplicación no carga
- Verificar que Apache esté corriendo
- Verificar la ruta en el navegador
- Revisar la consola del navegador (F12) para errores

### Los datos no se guardan
- Verificar permisos de escritura en la carpeta
- Revisar la consola del navegador para errores
- Verificar que la API esté respondiendo (revisar Network en DevTools)

## Estructura de Archivos en htdocs

```
C:\xampp\htdocs\ExamPracticoAWP\
├── index.html
├── styles.css
├── app.js
├── sw.js
├── manifest.json
├── icon.svg
├── config.php
├── database.sql
├── setup_users.php
├── api/
│   ├── departamentos.php
│   └── login.php
├── CREDENCIALES.md
└── README.md
```

## Notas Importantes

- **Seguridad**: Este es un proyecto de demostración. En producción, deberías:
  - Usar hash de contraseñas
  - Implementar tokens de autenticación
  - Validar y sanitizar todas las entradas
  - Usar prepared statements (PDO) en lugar de consultas directas

- **CORS**: El archivo `config.php` incluye headers CORS para desarrollo. En producción, restringe los orígenes permitidos.

- **Offline**: La aplicación funciona offline usando IndexedDB. Los cambios se sincronizan automáticamente cuando se restaura la conexión.

## Soporte

Si tienes problemas:
1. Revisa los logs de Apache en `C:\xampp\apache\logs\error.log`
2. Revisa los logs de MySQL en `C:\xampp\mysql\data\mysql_error.log`
3. Revisa la consola del navegador (F12)

