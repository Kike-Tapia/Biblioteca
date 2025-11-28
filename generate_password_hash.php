<?php
// Script para generar hash de contraseñas
// Ejecutar desde línea de comandos: php generate_password_hash.php

$passwords = [
    'admin123',
    'usuario123'
];

echo "Hashes de contraseñas generados:\n\n";

foreach ($passwords as $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    echo "Contraseña: $password\n";
    echo "Hash: $hash\n\n";
}

// También mostrar los INSERT statements listos para usar
echo "\n--- INSERT statements listos para usar ---\n\n";
echo "INSERT INTO usuarios (username, password, nombre, email) VALUES\n";
echo "('admin', '" . password_hash('admin123', PASSWORD_DEFAULT) . "', 'Administrador del Sistema', 'admin@departamentos.com'),\n";
echo "('usuario', '" . password_hash('usuario123', PASSWORD_DEFAULT) . "', 'Usuario General', 'usuario@departamentos.com');\n";
