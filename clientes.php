<?php
session_start();
require_once 'conexion.php';

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    header('Location: index.html');
    exit();
}

// Operaciones CRUD
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['agregar'])) {
        agregarCliente();
    } elseif (isset($_POST['editar'])) {
        editarCliente();
    } elseif (isset($_POST['buscar'])) {
        buscarClientes();
    }
}

function agregarCliente() {
    global $conexion;
    
    $nombre = $_POST['nombre'];
    $telefono = $_POST['telefono'];
    $email = $_POST['email'];
    $tipo = $_POST['tipo_cliente'];
    
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
?>