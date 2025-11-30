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

    $cliente_id = 0;
    $creado_ahora = false;

    // ⭐ PASO 1: Buscar o Crear Cliente para obtener cliente_id ⭐
    $sql_cliente = "SELECT id FROM clientes WHERE nombre = :nombre_cliente LIMIT 1";
    $stmt_cliente = $conexion->prepare($sql_cliente);
    $stmt_cliente->execute([':nombre_cliente' => $nombre_cliente]);
    $cliente = $stmt_cliente->fetch(PDO::FETCH_ASSOC);

    if ($cliente) {
        // Cliente encontrado, usamos su ID
        $cliente_id = $cliente['id'];
    } else {
        // Cliente NO encontrado, ¡lo creamos!
        try {
            // Insertar nuevo cliente con solo el nombre y tipo 'Regular' por defecto
            $sqlInsert = "INSERT INTO clientes (nombre, tipo_cliente, fecha_creacion)
                          VALUES (:nombre, 'Regular', NOW())";
            $stmt = $conexion->prepare($sqlInsert);
            $stmt->execute([':nombre' => $nombre_cliente]);
            
            $cliente_id = $conexion->lastInsertId();
            $creado_ahora = true;
            
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al crear cliente: ' . $e->getMessage()]);
            return;
        }
    }
    // ⭐ FIN Lógica de Creación/Búsqueda ⭐
    
    // ⭐ PASO 2: Insertar Venta con el cliente_id obtenido/creado ⭐
    // La tabla ventas DEBE incluir el campo cliente_id
    $sql = "INSERT INTO ventas (cliente_id, nombre_cliente, fecha_venta, total, tipo_armazon) 
            VALUES (:cliente_id, :nombre_cliente, :fecha_venta, :total, :tipo_armazon)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':cliente_id' => $cliente_id, 
        ':nombre_cliente' => $nombre_cliente,
        ':fecha_venta' => $fecha_venta,
        ':total' => $total,
        ':tipo_armazon' => $tipo_armazon
    ]);
    
    $mensaje = $creado_ahora 
               ? 'Cliente creado y venta agregada correctamente' 
               : 'Venta agregada correctamente';
               
    echo json_encode(['success' => true, 'message' => $mensaje]);
}

function obtenerVentas() {
    global $conexion;
    
    // Seleccionamos también cliente_id
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

    // ⭐ PASO DE INTEGRIDAD: Buscar cliente_id por nombre (el cliente debe existir) ⭐
    $sql_cliente = "SELECT id FROM clientes WHERE nombre = :nombre_cliente LIMIT 1";
    $stmt_cliente = $conexion->prepare($sql_cliente);
    $stmt_cliente->execute([':nombre_cliente' => $nombre_cliente]);
    $cliente = $stmt_cliente->fetch(PDO::FETCH_ASSOC);

    if (!$cliente) {
        // Bloquear edición si el cliente no existe
        echo json_encode(['success' => false, 'message' => 'Error de integridad: El cliente especificado no existe. No se puede editar.']);
        return;
    }
    $cliente_id = $cliente['id'];
    // ⭐ FIN PASO DE INTEGRIDAD ⭐
    
    // Incluir cliente_id en la actualización
    $sql = "UPDATE ventas SET cliente_id = :cliente_id, nombre_cliente = :nombre_cliente, fecha_venta = :fecha_venta, 
            total = :total, tipo_armazon = :tipo_armazon WHERE id = :id";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':cliente_id' => $cliente_id, 
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
    
    // La eliminación de ventas no requiere bloqueo, ya que no hay otras tablas que dependan de ella.
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
