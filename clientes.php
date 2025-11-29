// Si tu 'conexion.php' usa MySQLi, las sentencias preparadas dentro de las funciones
// deberán ser adaptadas a la sintaxis de MySQLi.
require_once 'conexion.php';

// Asegura que la respuesta sea en formato JSON
header('Content-Type: application/json');

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada.']);
    exit();
}

// --- Operaciones CRUD mediante la acción enviada por POST ---
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action'])) {
    switch ($_POST['action']) {
        case 'agregar':
            agregarCliente();
            break;
        case 'obtener':
            obtenerClientes(); // Devolver todos los clientes como JSON
            break;
        case 'editar':
            editarCliente();
            break;
        case 'buscar':
            buscarClientes(); // Función clave para autocompletar
            break;
        case 'obtener_por_id':
            obtenerClientePorId();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Solicitud POST o acción requerida.']);
}

// ----------------------------------------------------------------
//  FUNCIONES DE CLIENTES
// ----------------------------------------------------------------

// Implementación de Búsqueda (para Autocompletar)
function buscarClientes() {
    global $conexion;
    
    $termino = isset($_POST['termino']) ? trim($_POST['termino']) : '';
    
    if (empty($termino)) {
        echo json_encode(['success' => false, 'message' => 'Término de búsqueda vacío.']);
        return;
    }

    // Usamos LIKE y '%' para encontrar coincidencias al inicio del nombre.
    // Esto es ideal para autocompletar.
    $sql = "SELECT id, nombre, telefono, email, tipo_cliente 
            FROM clientes 
            WHERE nombre LIKE :termino 
            ORDER BY nombre ASC";

    $stmt = $conexion->prepare($sql);
    
    // El ' . '%' asegura que la búsqueda encuentre nombres que COMIENCEN con el término.
    $stmt->execute([':termino' => $termino . '%']);
    
    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true, 
        'clientes' => $clientes,
        'message' => count($clientes) > 0 ? 'Clientes encontrados.' : 'No se encontraron clientes.'
    ]);
}


function obtenerClientes() {
    global $conexion;
    
    $sql = "SELECT id, nombre, telefono, email, tipo_cliente, fecha_creacion FROM clientes ORDER BY fecha_creacion DESC";
    try {
        $stmt = $conexion->prepare($sql);
        $stmt->execute();
        $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'clientes' => $clientes]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al obtener clientes: ' . $e->getMessage()]);
    }
}


function agregarCliente() {
    global $conexion;
    
    // Sanitizar y obtener datos del POST
    $nombre = trim($_POST['nombre']);
    $telefono = trim($_POST['telefono']);
    $email = trim($_POST['email']);
    $tipo = $_POST['tipo_cliente'];
    
    if (empty($nombre) || empty($tipo)) {
        echo json_encode(['success' => false, 'message' => 'El nombre y el tipo son obligatorios.']);
        return;
    }
    
    try {
        $sql = "INSERT INTO clientes (nombre, telefono, email, tipo_cliente) 
                VALUES (:nombre, :telefono, :email, :tipo)";
        
        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':telefono' => $telefono,
            ':email' => $email,
            ':tipo' => $tipo
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Cliente agregado correctamente', 'id' => $conexion->lastInsertId()]);
    } catch (PDOException $e) {
        // En un entorno real, solo registrarías el error y mostrarías un mensaje genérico.
        echo json_encode(['success' => false, 'message' => 'Error al agregar cliente: ' . $e->getMessage()]);
    }
}

function editarCliente() {
    global $conexion;
    
    $id = $_POST['id'];
    $nombre = trim($_POST['nombre']);
    $telefono = trim($_POST['telefono']);
    $email = trim($_POST['email']);
    $tipo = $_POST['tipo_cliente'];
    
    if (empty($id) || empty($nombre) || empty($tipo)) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos para editar.']);
        return;
    }
    
    try {
        $sql = "UPDATE clientes SET nombre = :nombre, telefono = :telefono, email = :email, tipo_cliente = :tipo 
                WHERE id = :id";
        
        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':telefono' => $telefono,
            ':email' => $email,
            ':tipo' => $tipo,
            ':id' => $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Cliente actualizado correctamente']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar cliente: ' . $e->getMessage()]);
    }
}

function obtenerClientePorId() {
    global $conexion;
    
    $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de cliente inválido.']);
        return;
    }
    
    try {
        $sql = "SELECT id, nombre, telefono, email, tipo_cliente FROM clientes WHERE id = :id";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([':id' => $id]);
        $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($cliente) {
            echo json_encode(['success' => true, 'cliente' => $cliente]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Cliente no encontrado.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al buscar cliente: ' . $e->getMessage()]);
    }
}
