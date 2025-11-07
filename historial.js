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

// Cargar historiales al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarHistoriales();
    
    // Manejar formulario de agregar
    document.getElementById('formAgregar').addEventListener('submit', function(e) {
        e.preventDefault();
        agregarHistorial();
    });
    
    // Manejar formulario de editar
    document.getElementById('formEditar').addEventListener('submit', function(e) {
        e.preventDefault();
        editarHistorial();
    });
    
    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_historial').value = today;
    
    // Agregar event listener para Enter en el campo de búsqueda
    document.getElementById('buscar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarHistoriales();
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

function cargarHistoriales() {
    const formData = new FormData();
    formData.append('action', 'obtener');
    
    fetch('historiales_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarHistoriales(data.historiales);
        } else {
            console.error('Error:', data.message);
            showToast('Error al cargar historiales: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al cargar historiales', 'error');
    });
}

function mostrarHistoriales(historiales) {
    const lista = document.getElementById('listaHistoriales');
    const total = document.getElementById('totalHistoriales');
    
    lista.innerHTML = '';
    total.textContent = `${historiales.length} historiales`;
    
    if (historiales.length === 0) {
        lista.innerHTML = '<p class="placeholder">No hay historiales registrados</p>';
        return;
    }
    
    historiales.forEach(historial => {
        // Formatear fecha para mostrar
        const fechaFormateada = new Date(historial.fecha_historial + 'T00:00:00').toLocaleDateString('es-ES');
        
        // Acortar descripción si es muy larga
        const descripcionCorta = historial.descripcion && historial.descripcion.length > 100 
            ? historial.descripcion.substring(0, 100) + '...' 
            : historial.descripcion || 'Sin descripción';
        
        const historialHTML = `
            <div class="historial-item" data-id="${historial.id}">
                <div class="historial-info">
                    <h4>${historial.nombre_paciente}</h4>
                    <p>📋 ID: ${historial.id_historial || 'N/A'}</p>
                    <p>📅 Fecha: ${fechaFormateada}</p>
                    <p>📝 ${descripcionCorta}</p>
                    <p>🏥 Cirugías: ${historial.cirugias_previas || 'Ninguna'}</p>
                </div>
                <div class="historial-acciones">
                    <button class="btn-editar" onclick="editarHistorialForm(${historial.id})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarHistorial(${historial.id})">Eliminar</button>
                </div>
            </div>
        `;
        lista.innerHTML += historialHTML;
    });
}

function agregarHistorial() {
    const formData = new FormData(document.getElementById('formAgregar'));
    const mensaje = document.getElementById('mensajeAgregar');
    
    formData.append('action', 'agregar');
    
    mensaje.textContent = 'Agregando historial...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('historiales_ajax.php', {
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
            document.getElementById('fecha_historial').value = today;
            
            cargarHistoriales();
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

function editarHistorialForm(id) {
    const historialItem = document.querySelector(`.historial-item[data-id="${id}"]`);
    const nombre = historialItem.querySelector('h4').textContent;
    const idHistorial = historialItem.querySelector('p:nth-child(2)').textContent.replace('📋 ID: ', '');
    const fechaTexto = historialItem.querySelector('p:nth-child(3)').textContent.replace('📅 Fecha: ', '');
    const descripcion = historialItem.querySelector('p:nth-child(4)').textContent;
    const cirugias = historialItem.querySelector('p:nth-child(5)').textContent.replace('🏥 Cirugías: ', '');
    
    // Convertir fecha al formato YYYY-MM-DD
    const [dia, mes, anio] = fechaTexto.split('/');
    const fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_id_historial').value = idHistorial === 'N/A' ? '' : idHistorial;
    document.getElementById('edit_nombre_paciente').value = nombre;
    document.getElementById('edit_fecha_historial').value = fechaFormateada;
    document.getElementById('edit_descripcion').value = descripcion === 'Sin descripción' ? '' : descripcion;
    document.getElementById('edit_cirugias_previas').value = cirugias === 'Ninguna' ? '' : cirugias;
    
    document.getElementById('formEditar').style.display = 'block';
    document.getElementById('mensajeEditar').style.display = 'none';
}

function editarHistorial() {
    const formData = new FormData(document.getElementById('formEditar'));
    const mensaje = document.getElementById('mensajeEditar');
    
    formData.append('action', 'editar');
    
    mensaje.textContent = 'Actualizando historial...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('historiales_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje success';
            document.getElementById('formEditar').style.display = 'none';
            cargarHistoriales();
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

async function eliminarHistorial(id) {
    const confirmacion = await confirmWithToast('¿Estás seguro de que quieres eliminar este historial?');
    
    if (!confirmacion) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    
    fetch('historiales_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message, 'success');
            cargarHistoriales();
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showToast('Error de conexión: ' + error, 'error');
    });
}

function buscarHistoriales() {
    const termino = document.getElementById('buscar').value.trim();
    const formData = new FormData();
    
    formData.append('action', 'buscar');
    formData.append('termino', termino);
    
    fetch('historiales_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarHistoriales(data.historiales);
            if (termino) {
                showToast(`Se encontraron ${data.historiales.length} historiales`, 'info', 2000);
            }
        } else {
            console.error('Error:', data.message);
            showToast('Error al buscar historiales: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al buscar historiales', 'error');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarHistoriales();
}