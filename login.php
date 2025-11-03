<?php
session_start();
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $usuario = trim($_POST['usuario']);
    $password = $_POST['password'];
    
    try {
        $sql = "SELECT id, usuario, password, nombre, rol FROM usuarios WHERE usuario = :usuario";
        $stmt = $conexion->prepare($sql);
        $stmt->bindParam(':usuario', $usuario);
        $stmt->execute();
        
        if ($stmt->rowCount() == 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['usuario'] = $user['usuario'];
                $_SESSION['nombre'] = $user['nombre'];
                $_SESSION['rol'] = $user['rol'];
                
                echo json_encode(['success' => true, 'message' => 'Login exitoso', 'redirect' => 'clientes.html']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error del sistema: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>