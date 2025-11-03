<?php
$servidor = "localhost";
$usuario_bd = "root";  // Cambia según tu configuración
$password_bd = "";     // Cambia según tu configuración
$base_datos = "sistema_login";

try {
    $conexion = new PDO("mysql:host=$servidor;dbname=$base_datos", $usuario_bd, $password_bd);
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
?>