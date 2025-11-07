<?php
session_start();

// Headers para evitar cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Verificar si el usuario está logueado
if (!isset($_SESSION['user_id'])) {
    // Destruir sesión por seguridad
    session_destroy();
    
    // Redirigir al login con método que evita historial
    echo '<script>
        window.history.replaceState(null, null, window.location.href);
        window.location.replace("index.html");
    </script>';
    exit();
}

// Verificar inactividad (30 minutos)
$inactivity_time = 30 * 60; // 30 minutos en segundos
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $inactivity_time)) {
    session_destroy();
    echo '<script>
        window.history.replaceState(null, null, window.location.href);
        window.location.replace("index.html");
    </script>';
    exit();
}

// Actualizar tiempo de última actividad
$_SESSION['last_activity'] = time();

// Regenerar ID de sesión periódicamente para seguridad
if (!isset($_SESSION['created'])) {
    $_SESSION['created'] = time();
} else if (time() - $_SESSION['created'] > 1800) { // 30 minutos
    session_regenerate_id(true);
    $_SESSION['created'] = time();
}
?>