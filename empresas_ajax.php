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
            agregarEmpresa();
            break;
        case 'obtener':
            obtenerEmpresas();
            break;
        case 'editar':
            editarEmpresa();
            break;
        case 'eliminar':
            eliminarEmpresa();
            break;
        case 'buscar':
            buscarEmpresas();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
}

function agregarEmpresa() {
    global $conexion;
    
    $nombre = trim($_POST['nombre']);
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $direccion = trim($_POST['direccion'] ?? '');
    $rfc = trim($_POST['rfc'] ?? '');
    
    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
        return;
    }
    
    $sql = "INSERT INTO empresas (nombre, telefono, email, direccion, rfc) 
            VALUES (:nombre, :telefono, :email, :direccion, :rfc)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':direccion' => $direccion,
        ':rfc' => $rfc
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Empresa agregada correctamente']);
}

function obtenerEmpresas() {
    global $conexion;
    
    $sql = "SELECT * FROM empresas ORDER BY fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'empresas' => $empresas]);
}

function editarEmpresa() {
    global $conexion;
    
    $id = $_POST['id'];
    $nombre = trim($_POST['nombre']);
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $direccion = trim($_POST['direccion'] ?? '');
    $rfc = trim($_POST['rfc'] ?? '');
    
    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
        return;
    }
    
    $sql = "UPDATE empresas SET nombre = :nombre, telefono = :telefono, 
            email = :email, direccion = :direccion, rfc = :rfc 
            WHERE id = :id";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':direccion' => $direccion,
        ':rfc' => $rfc
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Empresa actualizada correctamente']);
}

function eliminarEmpresa() {
    global $conexion;
    
    $id = $_POST['id'];
    
    $sql = "DELETE FROM empresas WHERE id = :id";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Empresa eliminada correctamente']);
}

function buscarEmpresas() {
    global $conexion;
    
    $termino = $_POST['termino'] ?? '';
    
    $sql = "SELECT * FROM empresas WHERE nombre LIKE :termino OR rfc LIKE :termino 
            ORDER BY fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':termino' => "%$termino%"]);
    $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'empresas' => $empresas]);
}
?>