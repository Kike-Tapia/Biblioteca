<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getCalificaciones();
        break;
    case 'POST':
        createCalificacion();
        break;
    case 'PUT':
        updateCalificacion();
        break;
    case 'DELETE':
        deleteCalificacion();
        break;
    default:
        sendError('Método no permitido', 405);
}

// READ - Obtener todas las calificaciones
function getCalificaciones() {
    $conn = getConnection();
    
    $idLibro = isset($_GET['idLibro']) ? intval($_GET['idLibro']) : null;
    
    if ($idLibro) {
        // Obtener calificaciones de un libro específico
        $sql = "SELECT c.idCalificacion, c.idLibro, c.calificacion, c.resena, l.titulo as libroTitulo
                FROM calificaciones c
                INNER JOIN libros l ON c.idLibro = l.idLibro
                WHERE c.idLibro = ?
                ORDER BY c.idCalificacion DESC";
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            $conn->close();
            sendError('Error al preparar consulta: ' . $conn->error, 500);
        }
        
        $stmt->bind_param("i", $idLibro);
    } else {
        // Obtener todas las calificaciones
        $sql = "SELECT c.idCalificacion, c.idLibro, c.calificacion, c.resena, l.titulo as libroTitulo
                FROM calificaciones c
                INNER JOIN libros l ON c.idLibro = l.idLibro
                ORDER BY c.idCalificacion DESC";
        $stmt = $conn->prepare($sql);
        
        if ($stmt === false) {
            $conn->close();
            sendError('Error al preparar consulta: ' . $conn->error, 500);
        }
    }
    
    if (!$stmt->execute()) {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al ejecutar consulta: ' . $error, 500);
    }
    
    $result = $stmt->get_result();
    
    $calificaciones = [];
    while ($row = $result->fetch_assoc()) {
        $row['idCalificacion'] = intval($row['idCalificacion']);
        $row['idLibro'] = intval($row['idLibro']);
        $row['calificacion'] = intval($row['calificacion']);
        $calificaciones[] = $row;
    }
    
    $stmt->close();
    $conn->close();
    
    sendResponse(['calificaciones' => $calificaciones]);
}

// CREATE - Crear nueva calificación
function createCalificacion() {
    $conn = getConnection();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['idLibro']) || !isset($data['calificacion']) || !isset($data['resena'])) {
        $conn->close();
        sendError('Faltan campos requeridos', 400);
    }
    
    $idLibro = intval($data['idLibro']);
    $calificacion = intval($data['calificacion']);
    $resena = trim($data['resena']);
    
    // Validar que la calificación esté entre 1 y 5
    if ($calificacion < 1 || $calificacion > 5) {
        $conn->close();
        sendError('La calificación debe estar entre 1 y 5', 400);
    }
    
    // Verificar que el libro existe
    $checkLibro = $conn->prepare("SELECT idLibro FROM libros WHERE idLibro = ?");
    $checkLibro->bind_param("i", $idLibro);
    $checkLibro->execute();
    $result = $checkLibro->get_result();
    if ($result->num_rows === 0) {
        $checkLibro->close();
        $conn->close();
        sendError('El libro especificado no existe', 404);
    }
    $checkLibro->close();
    
    $sql = "INSERT INTO calificaciones (idLibro, calificacion, resena) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        $conn->close();
        sendError('Error al preparar consulta: ' . $conn->error, 500);
    }
    
    $stmt->bind_param("iis", $idLibro, $calificacion, $resena);
    
    if ($stmt->execute()) {
        $newId = $conn->insert_id;
        $stmt->close();
        $conn->close();
        sendResponse([
            'success' => true,
            'message' => 'Calificación creada exitosamente',
            'id' => $newId
        ], 201);
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al crear calificación: ' . $error, 500);
    }
}

// UPDATE - Actualizar calificación
function updateCalificacion() {
    $conn = getConnection();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['idCalificacion'])) {
        $conn->close();
        sendError('ID de calificación requerido', 400);
    }
    
    $idCalificacion = intval($data['idCalificacion']);
    
    if (!isset($data['calificacion']) || !isset($data['resena'])) {
        $conn->close();
        sendError('Faltan campos requeridos', 400);
    }
    
    $calificacion = intval($data['calificacion']);
    $resena = trim($data['resena']);
    
    // Validar que la calificación esté entre 1 y 5
    if ($calificacion < 1 || $calificacion > 5) {
        $conn->close();
        sendError('La calificación debe estar entre 1 y 5', 400);
    }
    
    $sql = "UPDATE calificaciones SET calificacion = ?, resena = ? WHERE idCalificacion = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        $conn->close();
        sendError('Error al preparar consulta: ' . $conn->error, 500);
    }
    
    $stmt->bind_param("isi", $calificacion, $resena, $idCalificacion);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            $conn->close();
            sendResponse([
                'success' => true,
                'message' => 'Calificación actualizada exitosamente'
            ]);
        } else {
            $stmt->close();
            $conn->close();
            sendError('Calificación no encontrada', 404);
        }
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al actualizar calificación: ' . $error, 500);
    }
}

// DELETE - Eliminar calificación
function deleteCalificacion() {
    $conn = getConnection();
    
    $idCalificacion = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if (!$idCalificacion) {
        $data = json_decode(file_get_contents('php://input'), true);
        $idCalificacion = isset($data['id']) ? intval($data['id']) : null;
    }
    
    if (!$idCalificacion) {
        $conn->close();
        sendError('ID de calificación requerido', 400);
    }
    
    $sql = "DELETE FROM calificaciones WHERE idCalificacion = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        $conn->close();
        sendError('Error al preparar consulta: ' . $conn->error, 500);
    }
    
    $stmt->bind_param("i", $idCalificacion);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            $conn->close();
            sendResponse([
                'success' => true,
                'message' => 'Calificación eliminada exitosamente'
            ]);
        } else {
            $stmt->close();
            $conn->close();
            sendError('Calificación no encontrada', 404);
        }
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al eliminar calificación: ' . $error, 500);
    }
}

