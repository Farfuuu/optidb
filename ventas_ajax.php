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
            agregarVenta();
            break;
        case 'obtener':
            obtenerVentas();
            break;
        case 'editar':
            editarVenta();
            break;
        case 'eliminar':
            eliminarVenta();
            break;
        case 'buscar':
            buscarVentas();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
}

function agregarVenta() {
    global $conexion;
    
    $nombre_cliente = trim($_POST['nombre_cliente']);
    $fecha_venta = $_POST['fecha_venta'];
    $total = $_POST['total'];
    $tipo_armazon = trim($_POST['tipo_armazon'] ?? '');
    
    if (empty($nombre_cliente) || empty($fecha_venta) || empty($total)) {
        echo json_encode(['success' => false, 'message' => 'Nombre del cliente, fecha y total son obligatorios']);
        return;
    }
    
    $sql = "INSERT INTO ventas (nombre_cliente, fecha_venta, total, tipo_armazon) 
            VALUES (:nombre_cliente, :fecha_venta, :total, :tipo_armazon)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':nombre_cliente' => $nombre_cliente,
        ':fecha_venta' => $fecha_venta,
        ':total' => $total,
        ':tipo_armazon' => $tipo_armazon
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Venta agregada correctamente']);
}

function obtenerVentas() {
    global $conexion;
    
    $sql = "SELECT * FROM ventas ORDER BY fecha_venta DESC, fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'ventas' => $ventas]);
}

function editarVenta() {
    global $conexion;
    
    $id = $_POST['id'];
    $nombre_cliente = trim($_POST['nombre_cliente']);
    $fecha_venta = $_POST['fecha_venta'];
    $total = $_POST['total'];
    $tipo_armazon = trim($_POST['tipo_armazon'] ?? '');
    
    if (empty($nombre_cliente) || empty($fecha_venta) || empty($total)) {
        echo json_encode(['success' => false, 'message' => 'Nombre del cliente, fecha y total son obligatorios']);
        return;
    }
    
    $sql = "UPDATE ventas SET nombre_cliente = :nombre_cliente, fecha_venta = :fecha_venta, 
            total = :total, tipo_armazon = :tipo_armazon WHERE id = :id";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':nombre_cliente' => $nombre_cliente,
        ':fecha_venta' => $fecha_venta,
        ':total' => $total,
        ':tipo_armazon' => $tipo_armazon
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Venta actualizada correctamente']);
}

function eliminarVenta() {
    global $conexion;
    
    $id = $_POST['id'];
    
    $sql = "DELETE FROM ventas WHERE id = :id";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':id' => $id]);
    
    echo json_encode(['success' => true, 'message' => 'Venta eliminada correctamente']);
}

function buscarVentas() {
    global $conexion;
    
    $termino = $_POST['termino'] ?? '';
    
    $sql = "SELECT * FROM ventas WHERE nombre_cliente LIKE :termino ORDER BY fecha_venta DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':termino' => "%$termino%"]);
    $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'ventas' => $ventas]);
}
?>