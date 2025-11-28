<?php
require_once '../config.php';

// Sistema de login con validación contra base de datos
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendError('Método no permitido', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password'])) {
    sendError('Usuario y contraseña requeridos', 400);
}

$username = trim($data['username']);
$password = $data['password'];

if (empty($username) || empty($password)) {
    sendError('Usuario y contraseña no pueden estar vacíos', 400);
}

// Validar contra la base de datos
$conn = getConnection();

$sql = "SELECT id, username, password, nombre, email FROM usuarios WHERE username = ? AND activo = 1";
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    $conn->close();
    sendError('Error al preparar consulta: ' . $conn->error, 500);
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    $conn->close();
    sendError('Usuario o contraseña incorrectos', 401);
}

$user = $result->fetch_assoc();
$stmt->close();
$conn->close();

// Verificar contraseña usando password_verify
if (password_verify($password, $user['password'])) {
    // No enviar la contraseña en la respuesta
    unset($user['password']);
    
    sendResponse([
        'success' => true,
        'message' => 'Login exitoso',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'nombre' => $user['nombre'],
            'email' => $user['email']
        ]
    ]);
} else {
    sendError('Usuario o contraseña incorrectos', 401);
}
