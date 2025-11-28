<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getLibros();
        break;
    case 'POST':
        createLibro();
        break;
    case 'PUT':
        updateLibro();
        break;
    case 'DELETE':
        deleteLibro();
        break;
    default:
        sendError('Método no permitido', 405);
}

// READ - Obtener todos los libros
function getLibros() {
    $conn = getConnection();
    
    $sql = "SELECT idLibro, titulo, autor, fechaPublicacion, resena, 
            CASE WHEN portada IS NOT NULL THEN 1 ELSE 0 END as tienePortada
            FROM libros ORDER BY idLibro ASC";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        $conn->close();
        sendError('Error al preparar consulta: ' . $conn->error, 500);
    }
    
    if (!$stmt->execute()) {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al ejecutar consulta: ' . $error, 500);
    }
    
    $result = $stmt->get_result();
    
    $libros = [];
    while ($row = $result->fetch_assoc()) {
        $row['idLibro'] = intval($row['idLibro']);
        $row['tienePortada'] = (bool)$row['tienePortada'];
        // Convertir fecha a formato legible
        $row['fechaPublicacion'] = $row['fechaPublicacion'];
        $libros[] = $row;
    }
    
    $stmt->close();
    $conn->close();
    
    sendResponse(['libros' => $libros]);
}

// CREATE - Crear nuevo libro
function createLibro() {
    $conn = getConnection();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['titulo']) || !isset($data['autor']) || 
        !isset($data['fechaPublicacion']) || !isset($data['resena'])) {
        $conn->close();
        sendError('Faltan campos requeridos', 400);
    }
    
    $titulo = trim($data['titulo']);
    $autor = trim($data['autor']);
    $fechaPublicacion = trim($data['fechaPublicacion']);
    $resena = trim($data['resena']);
    $portada = null;
    
    // Manejar portada si viene en base64
    if (isset($data['portada']) && !empty($data['portada'])) {
        // Si viene como base64, convertir a blob
        $portadaData = $data['portada'];
        if (preg_match('/^data:image\/(\w+);base64,/', $portadaData, $matches)) {
            $portadaData = substr($portadaData, strpos($portadaData, ',') + 1);
            $portada = base64_decode($portadaData);
        }
    }
    
    $sql = "INSERT INTO libros (titulo, autor, fechaPublicacion, portada, resena) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        $conn->close();
        sendError('Error al preparar consulta: ' . $conn->error, 500);
    }
    
    $null = null;
    $stmt->bind_param("sssbs", $titulo, $autor, $fechaPublicacion, $null, $resena);
    
    if ($portada !== null) {
        $stmt->send_long_data(3, $portada);
    }
    
    if ($stmt->execute()) {
        $newId = $conn->insert_id;
        $stmt->close();
        $conn->close();
        sendResponse([
            'success' => true,
            'message' => 'Libro creado exitosamente',
            'id' => $newId
        ], 201);
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al crear libro: ' . $error, 500);
    }
}

// UPDATE - Actualizar libro
function updateLibro() {
    $conn = getConnection();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['idLibro'])) {
        $conn->close();
        sendError('ID de libro requerido', 400);
    }
    
    $idLibro = intval($data['idLibro']);
    
    if (!isset($data['titulo']) || !isset($data['autor']) || 
        !isset($data['fechaPublicacion']) || !isset($data['resena'])) {
        $conn->close();
        sendError('Faltan campos requeridos', 400);
    }
    
    $titulo = trim($data['titulo']);
    $autor = trim($data['autor']);
    $fechaPublicacion = trim($data['fechaPublicacion']);
    $resena = trim($data['resena']);
    $portada = null;
    
    // Manejar portada si viene en base64
    if (isset($data['portada']) && !empty($data['portada'])) {
        $portadaData = $data['portada'];
        if (preg_match('/^data:image\/(\w+);base64,/', $portadaData, $matches)) {
            $portadaData = substr($portadaData, strpos($portadaData, ',') + 1);
            $portada = base64_decode($portadaData);
        }
    }
    
    // Si hay portada, actualizar también la portada
    if ($portada !== null) {
        $sql = "UPDATE libros SET titulo = ?, autor = ?, fechaPublicacion = ?, portada = ?, resena = ? WHERE idLibro = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            $conn->close();
            sendError('Error al preparar consulta: ' . $conn->error, 500);
        }
        $null = null;
        $stmt->bind_param("sssbsi", $titulo, $autor, $fechaPublicacion, $null, $resena, $idLibro);
        $stmt->send_long_data(3, $portada);
    } else {
        $sql = "UPDATE libros SET titulo = ?, autor = ?, fechaPublicacion = ?, resena = ? WHERE idLibro = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt === false) {
            $conn->close();
            sendError('Error al preparar consulta: ' . $conn->error, 500);
        }
        $stmt->bind_param("ssssi", $titulo, $autor, $fechaPublicacion, $resena, $idLibro);
    }
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            $conn->close();
            sendResponse([
                'success' => true,
                'message' => 'Libro actualizado exitosamente'
            ]);
        } else {
            $stmt->close();
            $conn->close();
            sendError('Libro no encontrado', 404);
        }
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al actualizar libro: ' . $error, 500);
    }
}

// DELETE - Eliminar libro
function deleteLibro() {
    $conn = getConnection();
    
    $idLibro = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if (!$idLibro) {
        $data = json_decode(file_get_contents('php://input'), true);
        $idLibro = isset($data['id']) ? intval($data['id']) : null;
    }
    
    if (!$idLibro) {
        $conn->close();
        sendError('ID de libro requerido', 400);
    }
    
    // Primero eliminar calificaciones relacionadas
    $sqlDeleteCalif = "DELETE FROM calificaciones WHERE idLibro = ?";
    $stmtCalif = $conn->prepare($sqlDeleteCalif);
    if ($stmtCalif) {
        $stmtCalif->bind_param("i", $idLibro);
        $stmtCalif->execute();
        $stmtCalif->close();
    }
    
    // Luego eliminar el libro
    $sql = "DELETE FROM libros WHERE idLibro = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        $conn->close();
        sendError('Error al preparar consulta: ' . $conn->error, 500);
    }
    
    $stmt->bind_param("i", $idLibro);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            $conn->close();
            sendResponse([
                'success' => true,
                'message' => 'Libro eliminado exitosamente'
            ]);
        } else {
            $stmt->close();
            $conn->close();
            sendError('Libro no encontrado', 404);
        }
    } else {
        $error = $stmt->error;
        $stmt->close();
        $conn->close();
        sendError('Error al eliminar libro: ' . $error, 500);
    }
}

