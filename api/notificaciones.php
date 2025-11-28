<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getNotificaciones();
        break;
    case 'POST':
        createNotificacion();
        break;
    default:
        sendError('Método no permitido', 405);
}

function getNotificaciones() {
    $conn = getConnection();
    $lastId = isset($_GET['last_id']) ? intval($_GET['last_id']) : 0;
    $limit = isset($_GET['limit']) ? min(intval($_GET['limit']), 100) : 50;

    $sql = "SELECT id, titulo, mensaje, modulo, usuario, created_at 
            FROM notificaciones
            WHERE id > ?
            ORDER BY id ASC
            LIMIT ?";
    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        $conn->close();
        sendError('Error al preparar consulta: ' . $conn->error, 500);
    }

    $stmt->bind_param("ii", $lastId, $limit);

    if (!$stmt->execute()) {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al ejecutar consulta: ' . $error, 500);
    }

    $result = $stmt->get_result();
    $notificaciones = [];

    while ($row = $result->fetch_assoc()) {
        $row['id'] = intval($row['id']);
        $notificaciones[] = $row;
    }

    $stmt->close();
    $conn->close();

    sendResponse(['notificaciones' => $notificaciones]);
}

function createNotificacion() {
    $conn = getConnection();
    $data = json_decode(file_get_contents('php://input'), true);

    if (
        !isset($data['titulo']) ||
        !isset($data['mensaje']) ||
        !isset($data['modulo']) ||
        !isset($data['usuario'])
    ) {
        $conn->close();
        sendError('Faltan campos requeridos', 400);
    }

    $titulo = trim($data['titulo']);
    $mensaje = trim($data['mensaje']);
    $modulo = trim($data['modulo']);
    $usuario = trim($data['usuario']);

    if ($titulo === '' || $mensaje === '' || $modulo === '' || $usuario === '') {
        $conn->close();
        sendError('Los campos no pueden estar vacíos', 400);
    }

    $sql = "INSERT INTO notificaciones (titulo, mensaje, modulo, usuario) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        $conn->close();
        sendError('Error al preparar consulta: ' . $conn->error, 500);
    }

    $stmt->bind_param("ssss", $titulo, $mensaje, $modulo, $usuario);

    if ($stmt->execute()) {
        $newId = $conn->insert_id;
        $stmt->close();
        $conn->close();
        sendResponse([
            'success' => true,
            'notification' => [
                'id' => intval($newId),
                'titulo' => $titulo,
                'mensaje' => $mensaje,
                'modulo' => $modulo,
                'usuario' => $usuario,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ], 201);
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al crear notificación: ' . $error, 500);
    }
}

