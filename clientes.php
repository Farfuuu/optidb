<?php
session_start();
require_once 'conexion.php';

// Asegura que la respuesta sea en formato JSON para AJAX
header('Content-Type: application/json');

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada. Acceso denegado.']);
    exit();
}

// --- Ruteo de acciones (Usando 'action' de POST) ---
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    
    try {
        switch ($action) {
            case 'agregar':
                agregarCliente();
                break;
            case 'obtener':
                // Llama a la función y envuelve la respuesta en JSON
                $clientes = obtenerClientes();
                echo json_encode(['success' => true, 'clientes' => $clientes]);
                break;
            case 'editar':
                editarCliente();
                break;
            case 'eliminar':
                eliminarCliente();
                break;
            case 'buscar':
                buscarClientes(); // <--- La función que implementa el autocompletado
                break;
            default:
                echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Solicitud POST o acción requerida.']);
}

// ----------------------------------------------------------------
//  FUNCIONES DE GESTIÓN DE CLIENTES
// ----------------------------------------------------------------

/**
 * Busca clientes por nombre (para autocompletar)
 * Devuelve un array de clientes que coinciden con el término.
 */
function buscarClientes() {
    global $conexion;
    
    $termino = isset($_POST['termino']) ? trim($_POST['termino']) : '';
    
    if (empty($termino)) {
        echo json_encode(['success' => true, 'clientes' => [], 'message' => 'Término de búsqueda vacío.']);
        return;
    }

    // Buscamos campos clave para autocompletar
    $sql = "SELECT id, nombre, telefono, email, tipo_cliente, empresa_nombre 
            FROM clientes 
            WHERE nombre LIKE :termino 
            ORDER BY nombre ASC";

    $stmt = $conexion->prepare($sql);
    
    // El ' . '%' busca nombres que COMIENCEN con el texto (mejor para autocompletar)
    $stmt->execute([':termino' => $termino . '%']);
    
    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true, 
        'clientes' => $clientes,
        'message' => count($clientes) > 0 ? 'Clientes encontrados.' : 'No se encontraron clientes.'
    ]);
}


function agregarCliente() {
    global $conexion;
    
    $nombre = trim($_POST['nombre']);
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $tipo = $_POST['tipo_cliente'] ?? 'Regular';
    $empresa = trim($_POST['empresa_nombre'] ?? ''); // Asumo que este campo existe en tu DB
    
    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre del cliente es obligatorio.']);
        return;
    }

    $sql = "INSERT INTO clientes (nombre, telefono, email, tipo_cliente, empresa_nombre) 
            VALUES (:nombre, :telefono, :email, :tipo, :empresa)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':tipo' => $tipo,
        ':empresa' => $empresa
    ]);
    
    // Devolver el ID es útil si el JS necesita referenciar al cliente recién creado
    echo json_encode(['success' => true, 'message' => 'Cliente agregado correctamente', 'cliente_id' => $conexion->lastInsertId()]);
}

function obtenerClientes() {
    global $conexion;
    
    // Se añade empresa_nombre a la consulta para mostrarlo en el frontend
    $sql = "SELECT id, nombre, telefono, email, tipo_cliente, empresa_nombre, fecha_creacion FROM clientes ORDER BY fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC); 
}

function editarCliente() {
    global $conexion;
    
    $id = $_POST['id'];
    $nombre = trim($_POST['nombre']);
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $tipo = $_POST['tipo_cliente'] ?? 'Regular';
    $empresa = trim($_POST['empresa_nombre'] ?? '');
    
    if (empty($id) || empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos para editar.']);
        return;
    }
    
    $sql = "UPDATE clientes SET nombre = :nombre, telefono = :telefono, email = :email, tipo_cliente = :tipo, empresa_nombre = :empresa
            WHERE id = :id";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':tipo' => $tipo,
        ':empresa' => $empresa,
        ':id' => $id
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
