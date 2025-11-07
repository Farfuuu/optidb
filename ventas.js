// Protección contra navegación hacia atrás
window.history.pushState(null, null, window.location.href);
window.onpopstate = function(event) {
    window.history.go(1);
};

// Prevenir cache
window.onpageshow = function(event) {
    if (event.persisted) {
        window.location.reload();
    }
};

// Verificar inactividad (30 minutos)
let inactivityTime = function() {
    let time;
    
    function logout() {
        window.location.replace('logout.php');
    }
    
    function resetTimer() {
        clearTimeout(time);
        time = setTimeout(logout, 30 * 60 * 1000); // 30 minutos
    }

    // Eventos para resetear el timer
    window.addEventListener('load', resetTimer);
    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keypress', resetTimer);
};

inactivityTime();

// Cargar ventas al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarVentas();
    
    // Manejar formulario de agregar
    document.getElementById('formAgregar').addEventListener('submit', function(e) {
        e.preventDefault();
        agregarVenta();
    });
    
    // Manejar formulario de editar
    document.getElementById('formEditar').addEventListener('submit', function(e) {
        e.preventDefault();
        editarVenta();
    });
    
    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_venta').value = today;
    
    // Agregar event listener para Enter en el campo de búsqueda
    document.getElementById('buscar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarVentas();
        }
    });
});

// Sistema de notificaciones Toast
function showToast(message, type = 'info', duration = 5000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }
    
    return toast;
}

// Función para confirmación con Toast
function confirmWithToast(question) {
    return new Promise((resolve) => {
        const toast = showToast(`
            <div style="text-align: center;">
                <p style="margin-bottom: 15px; color: #333;">${question}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="handleConfirm(true, this)" class="btn-editar" style="padding: 8px 20px; border: none; border-radius: 5px; cursor: pointer;">Sí</button>
                    <button onclick="handleConfirm(false, this)" class="btn-eliminar" style="padding: 8px 20px; border: none; border-radius: 5px; cursor: pointer;">No</button>
                </div>
            </div>
        `, 'warning', 0);
        
        window.handleConfirm = (result, button) => {
            toast.remove();
            resolve(result);
        };
    });
}

function cargarVentas() {
    const formData = new FormData();
    formData.append('action', 'obtener');
    
    fetch('ventas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarVentas(data.ventas);
        } else {
            console.error('Error:', data.message);
            showToast('Error al cargar ventas: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al cargar ventas', 'error');
    });
}

function mostrarVentas(ventas) {
    const lista = document.getElementById('listaVentas');
    const total = document.getElementById('totalVentas');
    
    lista.innerHTML = '';
    total.textContent = `${ventas.length} ventas`;
    
    if (ventas.length === 0) {
        lista.innerHTML = '<p class="placeholder">No hay ventas registradas</p>';
        return;
    }
    
    ventas.forEach(venta => {
        // Formatear fecha para mostrar
        const fechaFormateada = new Date(venta.fecha_venta + 'T00:00:00').toLocaleDateString('es-ES');
        // Formatear total como moneda
        const totalFormateado = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(venta.total);
        
        const ventaHTML = `
            <div class="venta-item" data-id="${venta.id}">
                <div class="venta-info">
                    <h4>${venta.nombre_cliente}</h4>
                    <p>📅 Fecha: ${fechaFormateada}</p>
                    <p>💰 Total: ${totalFormateado}</p>
                    <p>👓 Armazón: ${venta.tipo_armazon || 'N/A'}</p>
                </div>
                <div class="venta-acciones">
                    <button class="btn-editar" onclick="editarVentaForm(${venta.id})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarVenta(${venta.id})">Eliminar</button>
                </div>
            </div>
        `;
        lista.innerHTML += ventaHTML;
    });
}

function agregarVenta() {
    const formData = new FormData(document.getElementById('formAgregar'));
    const mensaje = document.getElementById('mensajeAgregar');
    
    formData.append('action', 'agregar');
    
    mensaje.textContent = 'Agregando venta...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('ventas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje success';
            document.getElementById('formAgregar').reset();
            
            // Restablecer fecha actual
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('fecha_venta').value = today;
            
            cargarVentas();
            showToast(data.message, 'success');
        } else {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje error';
            showToast(data.message, 'error');
        }
    })
    .catch(error => {
        mensaje.textContent = 'Error de conexión: ' + error;
        mensaje.className = 'mensaje error';
        showToast('Error de conexión: ' + error, 'error');
    })
    .finally(() => {
        setTimeout(() => {
            mensaje.style.display = 'none';
        }, 3000);
    });
}

function editarVentaForm(id) {
    const ventaItem = document.querySelector(`.venta-item[data-id="${id}"]`);
    const nombre = ventaItem.querySelector('h4').textContent;
    const fechaTexto = ventaItem.querySelector('p:nth-child(2)').textContent.replace('📅 Fecha: ', '');
    const totalTexto = ventaItem.querySelector('p:nth-child(3)').textContent.replace('💰 Total: ', '');
    const armazon = ventaItem.querySelector('p:nth-child(4)').textContent.replace('👓 Armazón: ', '');
    
    // Convertir fecha al formato YYYY-MM-DD
    const [dia, mes, anio] = fechaTexto.split('/');
    const fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    
    // Convertir total a número (eliminar símbolos de moneda)
    const totalNumero = totalTexto.replace(/[^\d.,]/g, '').replace(',', '');
    
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nombre_cliente').value = nombre;
    document.getElementById('edit_fecha_venta').value = fechaFormateada;
    document.getElementById('edit_total').value = totalNumero;
    document.getElementById('edit_tipo_armazon').value = armazon === 'N/A' ? '' : armazon;
    
    document.getElementById('formEditar').style.display = 'block';
    document.getElementById('mensajeEditar').style.display = 'none';
}

function editarVenta() {
    const formData = new FormData(document.getElementById('formEditar'));
    const mensaje = document.getElementById('mensajeEditar');
    
    formData.append('action', 'editar');
    
    mensaje.textContent = 'Actualizando venta...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('ventas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje success';
            document.getElementById('formEditar').style.display = 'none';
            cargarVentas();
            showToast(data.message, 'success');
        } else {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje error';
            showToast(data.message, 'error');
        }
    })
    .catch(error => {
        mensaje.textContent = 'Error de conexión: ' + error;
        mensaje.className = 'mensaje error';
        showToast('Error de conexión: ' + error, 'error');
    })
    .finally(() => {
        setTimeout(() => {
            mensaje.style.display = 'none';
        }, 3000);
    });
}

function cancelarEdicion() {
    document.getElementById('formEditar').style.display = 'none';
    document.getElementById('mensajeEditar').style.display = 'none';
}

async function eliminarVenta(id) {
    const confirmacion = await confirmWithToast('¿Estás seguro de que quieres eliminar esta venta?');
    
    if (!confirmacion) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    
    fetch('ventas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message, 'success');
            cargarVentas();
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showToast('Error de conexión: ' + error, 'error');
    });
}

function buscarVentas() {
    const termino = document.getElementById('buscar').value.trim();
    const formData = new FormData();
    
    formData.append('action', 'buscar');
    formData.append('termino', termino);
    
    fetch('ventas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarVentas(data.ventas);
            if (termino) {
                showToast(`Se encontraron ${data.ventas.length} ventas`, 'info', 2000);
            }
        } else {
            console.error('Error:', data.message);
            showToast('Error al buscar ventas: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al buscar ventas', 'error');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarVentas();
}