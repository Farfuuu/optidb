<?php
session_start();

// Destruir completamente la sesión
$_SESSION = array();

// Si se desea destruir la cookie de sesión, también se debe eliminar
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Finalmente, destruir la sesión
session_destroy();

// Headers para evitar cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Redirección con JavaScript para evitar historial
echo '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cerrando sesión...</title>
    <script>
        // Limpiar el historial de navegación
        if (window.history && window.history.pushState) {
            window.history.pushState(null, null, window.location.href);
            window.onpopstate = function(event) {
                window.history.go(1);
            };
        }
        
        // Redirigir al login después de un breve delay
        setTimeout(function() {
            window.location.replace("index.html");
        }, 100);
    </script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(90deg, #f8e6f0 30%, #e8f2f6 30%);">
        <div style="text-align: center; padding: 40px; background: white; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #654ea3; margin-bottom: 20px;">Cerrando sesión...</h2>
            <p style="color: #666;">Serás redirigido al login en un momento.</p>
        </div>
    </div>
</body>
</html>';
exit();
?>