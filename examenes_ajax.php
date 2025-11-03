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
            agregarExamen();
            break;
        case 'obtener':
            obtenerExamenes();
            break;
        case 'editar':
            editarExamen();
            break;
        case 'eliminar':
            eliminarExamen();
            break;
        case 'buscar':
            buscarExamenes();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
}

function agregarExamen() {
    global $conexion;
    
    $id_examen = trim($_POST['id_examen'] ?? '');
    $nombre_paciente = trim($_POST['nombre_paciente']);
    $fecha_examen = $_POST['fecha_examen'];
    $graduacion_oi = trim($_POST['graduacion_oi'] ?? '');
    $graduacion_od = trim($_POST['graduacion_od'] ?? '');
    
    if (empty($nombre_paciente) || empty($fecha_examen)) {
        echo json_encode(['success' => false, 'message' => 'Nombre del paciente y fecha son obligatorios']);
        return;
    }
    
    $sql = "INSERT INTO examenes_vista (id_examen, nombre_paciente, fecha_examen, graduacion_oi, graduacion_od) 
            VALUES (:id_examen, :nombre_paciente, :fecha_examen, :graduacion_oi, :graduacion_od)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id_examen' => $id_examen,
        ':nombre_paciente' => $nombre_paciente,
        ':fecha_examen' => $fecha_examen,
        ':graduacion_oi' => $graduacion_oi,
        ':graduacion_od' => $graduacion_od
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Examen agregado correctamente']);
}

function obtenerExamenes() {
    global $conexion;
    
    $sql = "SELECT * FROM examenes_vista ORDER BY fecha_examen DESC, fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $examenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'examenes' => $examenes]);
}

function editarExamen() {
    global $conexion;
    
    $id = $_POST['id'];
    $id_examen = trim($_POST['id_examen'] ?? '');
    $nombre_paciente = trim($_POST['nombre_paciente']);
    $fecha_examen = $_POST['fecha_examen'];
    $graduacion_oi = trim($_POST['graduacion_oi'] ?? '');
    $graduacion_od = trim($_POST['graduacion_od'] ?? '');
    
    if (empty($nombre_paciente) || empty($fecha_examen)) {
        echo json_encode(['success' => false, 'message' => 'Nombre del paciente y fecha son obligatorios']);
        return;
    }
    
    $sql = "UPDATE examenes_vista SET id_examen = :id_examen, nombre_paciente = :nombre_paciente, 
            fecha_examen = :fecha_examen, graduacion_oi = :graduacion_oi, graduacion_od = :graduacion_od 
            WHERE id = :id";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':id_examen' => $id_examen,
        ':nombre_paciente' => $nombre_paciente,
        ':fecha_examen' => $fecha_examen,
        ':graduacion_oi' => $graduacion_oi,
        ':graduacion_od' => $graduacion_od
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Examen actualizado correctamente']);
}

function eliminarExamen() {
    global $conexion;
    
    $id = $_POST['id'];
    
    $sql = "DELETE FROM examenes_vista WHERE id = :id";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Examen eliminado correctamente']);
}

function buscarExamenes() {
    global $conexion;
    
    $termino = $_POST['termino'] ?? '';
    
    $sql = "SELECT * FROM examenes_vista WHERE nombre_paciente LIKE :termino OR id_examen LIKE :termino 
            ORDER BY fecha_examen DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':termino' => "%$termino%"]);
    $examenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'examenes' => $examenes]);
}
?>