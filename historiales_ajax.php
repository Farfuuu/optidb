<?php
session_start();
require_once 'conexion.php';

header('Content-Type: application/json');

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

$action = $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'agregar':
            agregarHistorial();
            break;
        case 'obtener':
            obtenerHistoriales();
            break;
        case 'editar':
            editarHistorial();
            break;
        case 'eliminar':
            eliminarHistorial();
            break;
        case 'buscar':
            buscarHistoriales();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
}

function agregarHistorial() {
    global $conexion;
    
    $id_historial = trim($_POST['id_historial'] ?? '');
    $nombre_paciente = trim($_POST['nombre_paciente']);
    $fecha_historial = $_POST['fecha_historial'];
    $descripcion = trim($_POST['descripcion'] ?? '');
    $cirugias_previas = trim($_POST['cirugias_previas'] ?? '');
    
    if (empty($nombre_paciente) || empty($fecha_historial)) {
        echo json_encode(['success' => false, 'message' => 'Nombre del paciente y fecha son obligatorios']);
        return;
    }
    
    $sql = "INSERT INTO historiales_medicos (id_historial, nombre_paciente, fecha_historial, descripcion, cirugias_previas) 
            VALUES (:id_historial, :nombre_paciente, :fecha_historial, :descripcion, :cirugias_previas)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id_historial' => $id_historial,
        ':nombre_paciente' => $nombre_paciente,
        ':fecha_historial' => $fecha_historial,
        ':descripcion' => $descripcion,
        ':cirugias_previas' => $cirugias_previas
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Historial agregado correctamente']);
}

function obtenerHistoriales() {
    global $conexion;
    
    $sql = "SELECT * FROM historiales_medicos ORDER BY fecha_historial DESC, fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $historiales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'historiales' => $historiales]);
}

function editarHistorial() {
    global $conexion;
    
    $id = $_POST['id'];
    $id_historial = trim($_POST['id_historial'] ?? '');
    $nombre_paciente = trim($_POST['nombre_paciente']);
    $fecha_historial = $_POST['fecha_historial'];
    $descripcion = trim($_POST['descripcion'] ?? '');
    $cirugias_previas = trim($_POST['cirugias_previas'] ?? '');
    
    if (empty($nombre_paciente) || empty($fecha_historial)) {
        echo json_encode(['success' => false, 'message' => 'Nombre del paciente y fecha son obligatorios']);
        return;
    }
    
    $sql = "UPDATE historiales_medicos SET id_historial = :id_historial, nombre_paciente = :nombre_paciente, 
            fecha_historial = :fecha_historial, descripcion = :descripcion, cirugias_previas = :cirugias_previas 
            WHERE id = :id";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':id_historial' => $id_historial,
        ':nombre_paciente' => $nombre_paciente,
        ':fecha_historial' => $fecha_historial,
        ':descripcion' => $descripcion,
        ':cirugias_previas' => $cirugias_previas
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Historial actualizado correctamente']);
}

function eliminarHistorial() {
    global $conexion;
    
    $id = $_POST['id'];
    
    $sql = "DELETE FROM historiales_medicos WHERE id = :id";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Historial eliminado correctamente']);
}

function buscarHistoriales() {
    global $conexion;
    
    $termino = $_POST['termino'] ?? '';
    
    $sql = "SELECT * FROM historiales_medicos WHERE nombre_paciente LIKE :termino OR id_historial LIKE :termino 
            ORDER BY fecha_historial DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':termino' => "%$termino%"]);
    $historiales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'historiales' => $historiales]);
}
?>