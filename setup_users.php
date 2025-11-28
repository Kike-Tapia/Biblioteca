<?php
// Script para configurar usuarios en la base de datos
// Ejecutar una vez después de crear la base de datos
// Acceder desde navegador: http://localhost/ExamPracticoAWP/setup_users.php

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Configuración de Usuarios</h1>";

$conn = getConnection();

// Verificar si ya existen usuarios
$check = $conn->query("SELECT COUNT(*) as count FROM usuarios");
$row = $check->fetch_assoc();

if ($row['count'] > 0) {
    echo "<p>Ya existen usuarios en la base de datos.</p>";
    echo "<h2>Usuarios existentes:</h2>";
    $users = $conn->query("SELECT id, username, nombre, email FROM usuarios");
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>ID</th><th>Usuario</th><th>Nombre</th><th>Email</th></tr>";
    while ($user = $users->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $user['id'] . "</td>";
        echo "<td>" . htmlspecialchars($user['username']) . "</td>";
        echo "<td>" . htmlspecialchars($user['nombre']) . "</td>";
        echo "<td>" . htmlspecialchars($user['email']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    // Generar hashes de contraseñas
    $adminHash = password_hash('admin123', PASSWORD_DEFAULT);
    $usuarioHash = password_hash('usuario123', PASSWORD_DEFAULT);
    
    // Insertar usuarios
    $sql = "INSERT INTO usuarios (username, password, nombre, email) VALUES (?, ?, ?, ?), (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    $adminUser = 'admin';
    $adminName = 'Administrador del Sistema';
    $adminEmail = 'admin@biblioteca.com';
    $usuarioUser = 'usuario';
    $usuarioName = 'Usuario General';
    $usuarioEmail = 'usuario@biblioteca.com';
    
    $stmt->bind_param("ssssssss", 
        $adminUser, $adminHash, $adminName, $adminEmail,
        $usuarioUser, $usuarioHash, $usuarioName, $usuarioEmail
    );
    
    if ($stmt->execute()) {
        echo "<p style='color: green;'>✓ Usuarios creados exitosamente!</p>";
        echo "<h2>Credenciales de acceso:</h2>";
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>Usuario</th><th>Contraseña</th><th>Nombre</th></tr>";
        echo "<tr><td>admin</td><td>admin123</td><td>Administrador del Sistema</td></tr>";
        echo "<tr><td>usuario</td><td>usuario123</td><td>Usuario General</td></tr>";
        echo "</table>";
    } else {
        echo "<p style='color: red;'>Error al crear usuarios: " . $stmt->error . "</p>";
    }
    
    $stmt->close();
}

// Mostrar libros existentes
echo "<h2>Libros en la base de datos:</h2>";
$libros = $conn->query("SELECT idLibro, titulo, autor, fechaPublicacion FROM libros");
if ($libros->num_rows > 0) {
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>ID</th><th>Título</th><th>Autor</th><th>Fecha Publicación</th></tr>";
    while ($libro = $libros->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $libro['idLibro'] . "</td>";
        echo "<td>" . htmlspecialchars($libro['titulo']) . "</td>";
        echo "<td>" . htmlspecialchars($libro['autor']) . "</td>";
        echo "<td>" . $libro['fechaPublicacion'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    echo "<p>Total: " . $libros->num_rows . " libros</p>";
} else {
    echo "<p>No hay libros en la base de datos.</p>";
}

$conn->close();

echo "<hr>";
echo "<p><a href='index.html'>Volver a la aplicación</a></p>";

