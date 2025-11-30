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
    
    $nombre = trim($_POST['nombre'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $tipo_cliente = trim($_POST['tipo_cliente'] ?? 'Regular');
    $empresa_nombre = trim($_POST['empresa_nombre'] ?? ''); // Nombre de la empresa

    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
        return;
    }

    // --- Lógica de verificación de duplicados por email o teléfono ---
    $clauses = [];
    $params = [];
    if ($email !== '') { $clauses[] = 'email = :email'; $params[':email'] = $email; }
    if ($telefono !== '') { $clauses[] = 'telefono = :telefono'; $params[':telefono'] = $telefono; }
    
    if (!empty($clauses)) {
        $where = implode(' OR ', $clauses);
        $sql = "SELECT id FROM clientes WHERE $where LIMIT 1";
        $stmt = $conexion->prepare($sql);
        $stmt->execute($params);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode(['success' => false, 'message' => 'Ya existe un cliente con ese email o teléfono.']);
            return;
        }
    }
    // --- Fin verificación de duplicados ---

    // ⭐ LÓGICA DE INTEGRIDAD: Buscar empresa_id por nombre (si es corporativo) ⭐
    $empresa_id = NULL; 
    if ($tipo_cliente === 'Corporativo' && !empty($empresa_nombre)) {
        $sql_empresa = "SELECT id FROM empresas WHERE nombre = :nombre_empresa LIMIT 1";
        $stmt_empresa = $conexion->prepare($sql_empresa);
        $stmt_empresa->execute([':nombre_empresa' => $empresa_nombre]);
        $empresa = $stmt_empresa->fetch(PDO::FETCH_ASSOC);

        if ($empresa) {
            $empresa_id = $empresa['id'];
        } else {
            echo json_encode(['success' => false, 'message' => 'Error: La empresa seleccionada no existe.']);
            return;
        }
    }
    // ⭐ FIN LÓGICA DE INTEGRIDAD ⭐
    
    $sql = "INSERT INTO clientes (nombre, telefono, email, tipo_cliente, empresa_id) 
            VALUES (:nombre, :telefono, :email, :tipo_cliente, :empresa_id)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':tipo_cliente' => $tipo_cliente,
        ':empresa_id' => $empresa_id
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
    $empresa_nombre = trim($_POST['empresa_nombre'] ?? ''); 

    if (empty($nombre)) {
        echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
        return;
    }
    
    // ⭐ LÓGICA DE INTEGRIDAD: Buscar empresa_id por nombre ⭐
    $empresa_id = NULL; 
    if ($tipo_cliente === 'Corporativo' && !empty($empresa_nombre)) {
        $sql_empresa = "SELECT id FROM empresas WHERE nombre = :nombre_empresa LIMIT 1";
        $stmt_empresa = $conexion->prepare($sql_empresa);
        $stmt_empresa->execute([':nombre_empresa' => $empresa_nombre]);
        $empresa = $stmt_empresa->fetch(PDO::FETCH_ASSOC);

        if ($empresa) {
            $empresa_id = $empresa['id'];
        } else {
             echo json_encode(['success' => false, 'message' => 'Error: La empresa seleccionada no existe.']);
             return;
        }
    }
    // ⭐ FIN LÓGICA DE INTEGRIDAD ⭐
    
    $sql = "UPDATE clientes SET nombre = :nombre, telefono = :telefono, 
            email = :email, tipo_cliente = :tipo_cliente, empresa_id = :empresa_id WHERE id = :id";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':tipo_cliente' => $tipo_cliente,
        ':empresa_id' => $empresa_id
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Cliente actualizado correctamente']);
}

function eliminarCliente() {
    global $conexion;

    $id = $_POST['id'] ?? '';
    
    // ⭐ LÓGICA DE BLOQUEO COMPLETA (4 CHEQUEOS) ⭐
    
    // 1. Verificar Ventas dependientes (Usando cliente_id)
    $sql_ventas = "SELECT COUNT(*) FROM ventas WHERE cliente_id = :id";
    $stmt_ventas = $conexion->prepare($sql_ventas);
    $stmt_ventas->execute([':id' => $id]);
    if ($stmt_ventas->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Error: El cliente tiene ventas asociadas. Elimínelas primero.']);
        return;
    }
    
    // Obtenemos el nombre para verificar Historiales/Exámenes (si aún usan nombre_paciente)
    $sql_nombre = "SELECT nombre FROM clientes WHERE id = :id";
    $stmt_nombre = $conexion->prepare($sql_nombre);
    $stmt_nombre->execute([':id' => $id]);
    $nombre_cliente = $stmt_nombre->fetchColumn();
    
    // 2. Verificar Exámenes de Vista dependientes (Usando nombre_paciente)
    $sql_examenes = "SELECT COUNT(*) FROM examenes_vista WHERE nombre_paciente = :nombre";
    $stmt_examenes = $conexion->prepare($sql_examenes);
    $stmt_examenes->execute([':nombre' => $nombre_cliente]);
    if ($stmt_examenes->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Error: El cliente tiene exámenes de vista asociados. Elimínelos primero.']);
        return;
    }
    
    // 3. Verificar Historial Médico dependiente (Usando nombre_paciente)
    $sql_historial = "SELECT COUNT(*) FROM historiales_medicos WHERE nombre_paciente = :nombre";
    $stmt_historial = $conexion->prepare($sql_historial);
    $stmt_historial->execute([':nombre' => $nombre_cliente]);
    if ($stmt_historial->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Error: El cliente tiene historial médico asociado. Elimínelo primero.']);
        return;
    }

    // 4. Si no hay dependientes, eliminar
    $sql = "DELETE FROM clientes WHERE id = :id";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Cliente eliminado correctamente']);
}

function buscarClientes() {
    global $conexion;
    
    $termino = $_POST['termino'] ?? '';
    
    $sql = "SELECT c.* FROM clientes c WHERE c.nombre LIKE :termino OR c.telefono LIKE :termino OR c.email LIKE :termino ORDER BY c.fecha_creacion DESC";
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
