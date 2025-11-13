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
            agregarCliente();
            break;
        case 'obtener':
            obtenerClientes();
            break;
        case 'editar':
            editarCliente();
            break;
        case 'eliminar':
            eliminarCliente();
            break;
        case 'buscar':
            buscarClientes();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
}

function agregarCliente() {
    global $conexion;
    
    $nombre = trim($_POST['nombre']);
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $tipo_cliente = trim($_POST['tipo_cliente'] ?? 'Regular');
    
    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
        return;
    }
    
    $sql = "INSERT INTO clientes (nombre, telefono, email, tipo_cliente) 
            VALUES (:nombre, :telefono, :email, :tipo_cliente)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':tipo_cliente' => $tipo_cliente
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Cliente agregado correctamente']);
}

function obtenerClientes() {
    global $conexion;
    
    $sql = "SELECT c.* FROM clientes c ORDER BY c.fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener nombre de empresa para cada cliente si existe
    foreach ($clientes as &$cliente) {
        $cliente['empresa_nombre'] = '';
        if (!empty($cliente['empresa_id'])) {
            $sqlEmpresa = "SELECT nombre FROM empresas WHERE id = :id LIMIT 1";
            $stmtEmpresa = $conexion->prepare($sqlEmpresa);
            $stmtEmpresa->execute([':id' => $cliente['empresa_id']]);
            $empresa = $stmtEmpresa->fetch(PDO::FETCH_ASSOC);
            if ($empresa) {
                $cliente['empresa_nombre'] = $empresa['nombre'];
            }
        }
    }
    
    echo json_encode(['success' => true, 'clientes' => $clientes]);
}

function editarCliente() {
    global $conexion;
    
    $id = $_POST['id'];
    $nombre = trim($_POST['nombre']);
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $tipo_cliente = trim($_POST['tipo_cliente'] ?? 'Regular');
    
    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
        return;
    }
    
    $sql = "UPDATE clientes SET nombre = :nombre, telefono = :telefono, 
            email = :email, tipo_cliente = :tipo_cliente WHERE id = :id";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':tipo_cliente' => $tipo_cliente
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Cliente actualizado correctamente']);
}

function eliminarCliente() {
    global $conexion;
    
    $id = $_POST['id'];
    
    $sql = "DELETE FROM clientes WHERE id = :id";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Cliente eliminado correctamente']);
}

function buscarClientes() {
    global $conexion;
    
    $termino = $_POST['termino'] ?? '';
    
    $sql = "SELECT c.* FROM clientes c WHERE c.nombre LIKE :termino ORDER BY c.fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':termino' => "%$termino%"]);
    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener nombre de empresa para cada cliente si existe
    foreach ($clientes as &$cliente) {
        $cliente['empresa_nombre'] = '';
        if (!empty($cliente['empresa_id'])) {
            $sqlEmpresa = "SELECT nombre FROM empresas WHERE id = :id LIMIT 1";
            $stmtEmpresa = $conexion->prepare($sqlEmpresa);
            $stmtEmpresa->execute([':id' => $cliente['empresa_id']]);
            $empresa = $stmtEmpresa->fetch(PDO::FETCH_ASSOC);
            if ($empresa) {
                $cliente['empresa_nombre'] = $empresa['nombre'];
            }
        }
    }
    
    echo json_encode(['success' => true, 'clientes' => $clientes]);
}
?>