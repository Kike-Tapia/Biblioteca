# Credenciales de Acceso - Sistema de Gestión de Departamentos

## Usuarios del Sistema

Después de ejecutar `setup_users.php`, tendrás acceso a las siguientes cuentas:

### Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Nombre:** Administrador del Sistema
- **Email:** admin@departamentos.com

### Usuario General
- **Usuario:** `usuario`
- **Contraseña:** `usuario123`
- **Nombre:** Usuario General
- **Email:** usuario@departamentos.com

## Notas de Seguridad

⚠️ **IMPORTANTE:** Estas credenciales son solo para desarrollo y pruebas. En un entorno de producción:

1. Cambia todas las contraseñas por defecto
2. Usa contraseñas seguras y únicas
3. Implementa políticas de seguridad más estrictas
4. Considera usar autenticación de dos factores (2FA)

## Crear Nuevos Usuarios

Para crear nuevos usuarios, puedes:

1. **Usar phpMyAdmin:**
   - Ir a `http://localhost/phpmyadmin`
   - Seleccionar la base de datos `departamentos_db`
   - Ir a la tabla `usuarios`
   - Insertar nuevo registro
   - **IMPORTANTE:** La contraseña debe estar hasheada con `password_hash()` de PHP

2. **Usar PHP directamente:**
   ```php
   $hash = password_hash('tu_contraseña', PASSWORD_DEFAULT);
   // Usar este hash en la base de datos
   ```

3. **Modificar setup_users.php:**
   - Agregar más usuarios al script
   - Ejecutar nuevamente desde el navegador

## Verificar Usuarios

Para verificar que los usuarios se crearon correctamente:

1. Abrir: `http://localhost/ExamPracticoAWP/setup_users.php`
2. Verás una tabla con todos los usuarios existentes

## Problemas de Login

Si no puedes iniciar sesión:

1. Verifica que ejecutaste `setup_users.php`
2. Verifica que los usuarios existan en la base de datos
3. Revisa la consola del navegador (F12) para errores
4. Verifica que la API de login esté funcionando: `http://localhost/ExamPracticoAWP/api/login.php`
