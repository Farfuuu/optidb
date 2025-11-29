<?php
session_start();
require_once 'conexion.php';

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    // Tu lógica original para redirigir si no hay sesión
    header('Location: index.html'); 
    exit();
}

// Operaciones CRUD
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['agregar'])) {
        agregarCliente();
    } elseif (isset($_POST['editar'])) {
        editarCliente(); // Aquí se ejecutará si se llama con 'editar'
    } elseif (isset($_POST['buscar'])) {
        buscarClientes(); // Aquí se ejecutará si se llama con 'buscar'
    }
}

function agregarCliente() {
    global $conexion;
    
    $nombre = $_POST['nombre'];
    $telefono = $_POST['telefono'];
    $email = $_POST['email'];
    $tipo = $_POST['tipo_cliente'];
    // Se asume que empresa_nombre también debería estar aquí, lo dejaremos como estaba
    
    $sql = "INSERT INTO clientes (nombre, telefono, email, tipo_cliente) 
            VALUES (:nombre, :telefono, :email, :tipo)";
    
    $stmt = $conexion->prepare($sql);
    $stmt->execute([
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':email' => $email,
        ':tipo' => $tipo
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Cliente agregado correctamente']);
}

function obtenerClientes() {
    global $conexion;
    
    $sql = "SELECT * FROM clientes ORDER BY fecha_creacion DESC";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ----------------------------------------------------------------
//  FUNCIONES FALTANTES (Placeholders)
// ----------------------------------------------------------------

/**
 * Función que busca clientes (lógica del autocompletado).
 * Necesitarás agregar aquí la consulta SELECT y la salida JSON.
 */
function buscarClientes() {
    // Lógica para buscar cliente (debes implementarla aquí)
    echo json_encode(['success' => false, 'message' => 'Función buscarClientes no implementada.']);
}

/**
 * Función para editar clientes.
 */
function editarCliente() {
    // Lógica para editar cliente (debes implementarla aquí)
    echo json_encode(['success' => false, 'message' => 'Función editarCliente no implementada.']);
}
?>
