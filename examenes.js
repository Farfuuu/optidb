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

// Cargar exámenes al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarExamenes();
    
    // Manejar formulario de agregar
    document.getElementById('formAgregar').addEventListener('submit', function(e) {
        e.preventDefault();
        agregarExamen();
    });
    
    // Manejar formulario de editar
    document.getElementById('formEditar').addEventListener('submit', function(e) {
        e.preventDefault();
        editarExamen();
    });
    
    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_examen').value = today;
    
    // Agregar event listener para Enter en el campo de búsqueda
    document.getElementById('buscar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarExamenes();
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

function cargarExamenes() {
    const formData = new FormData();
    formData.append('action', 'obtener');
    
    fetch('examenes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarExamenes(data.examenes);
        } else {
            console.error('Error:', data.message);
            showToast('Error al cargar exámenes: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al cargar exámenes', 'error');
    });
}

function mostrarExamenes(examenes) {
    const lista = document.getElementById('listaExamenes');
    const total = document.getElementById('totalExamenes');
    
    lista.innerHTML = '';
    total.textContent = `${examenes.length} exámenes`;
    
    if (examenes.length === 0) {
        lista.innerHTML = '<p class="placeholder">No hay exámenes registrados</p>';
        return;
    }
    
    examenes.forEach(examen => {
        // Formatear fecha para mostrar
        const fechaFormateada = new Date(examen.fecha_examen + 'T00:00:00').toLocaleDateString('es-ES');
        
        const examenHTML = `
            <div class="examen-item" data-id="${examen.id}">
                <div class="examen-info">
                    <h4>${examen.nombre_paciente}</h4>
                    <p>📋 ID: ${examen.id_examen || 'N/A'}</p>
                    <p>📅 Fecha: ${fechaFormateada}</p>
                    <p>👁️ OI: ${examen.graduacion_oi || 'N/A'} | OD: ${examen.graduacion_od || 'N/A'}</p>
                </div>
                <div class="examen-acciones">
                    <button class="btn-editar" onclick="editarExamenForm(${examen.id})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarExamen(${examen.id})">Eliminar</button>
                </div>
            </div>
        `;
        lista.innerHTML += examenHTML;
    });
}

function agregarExamen() {
    const formData = new FormData(document.getElementById('formAgregar'));
    const mensaje = document.getElementById('mensajeAgregar');
    
    formData.append('action', 'agregar');
    
    mensaje.textContent = 'Agregando examen...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('examenes_ajax.php', {
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
            document.getElementById('fecha_examen').value = today;
            
            cargarExamenes();
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

function editarExamenForm(id) {
    const examenItem = document.querySelector(`.examen-item[data-id="${id}"]`);
    const nombre = examenItem.querySelector('h4').textContent;
    const idExamen = examenItem.querySelector('p:nth-child(2)').textContent.replace('📋 ID: ', '');
    const fechaTexto = examenItem.querySelector('p:nth-child(3)').textContent.replace('📅 Fecha: ', '');
    const graduaciones = examenItem.querySelector('p:nth-child(4)').textContent.replace('👁️ OI: ', '').split(' | OD: ');
    
    // Convertir fecha al formato YYYY-MM-DD
    const [dia, mes, anio] = fechaTexto.split('/');
    const fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_id_examen').value = idExamen === 'N/A' ? '' : idExamen;
    document.getElementById('edit_nombre_paciente').value = nombre;
    document.getElementById('edit_fecha_examen').value = fechaFormateada;
    document.getElementById('edit_graduacion_oi').value = graduaciones[0] === 'N/A' ? '' : graduaciones[0];
    document.getElementById('edit_graduacion_od').value = graduaciones[1] === 'N/A' ? '' : graduaciones[1];
    
    document.getElementById('formEditar').style.display = 'block';
    document.getElementById('mensajeEditar').style.display = 'none';
}

function editarExamen() {
    const formData = new FormData(document.getElementById('formEditar'));
    const mensaje = document.getElementById('mensajeEditar');
    
    formData.append('action', 'editar');
    
    mensaje.textContent = 'Actualizando examen...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('examenes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje success';
            document.getElementById('formEditar').style.display = 'none';
            cargarExamenes();
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

async function eliminarExamen(id) {
    const confirmacion = await confirmWithToast('¿Estás seguro de que quieres eliminar este examen?');
    
    if (!confirmacion) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    
    fetch('examenes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message, 'success');
            cargarExamenes();
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showToast('Error de conexión: ' + error, 'error');
    });
}

function buscarExamenes() {
    const termino = document.getElementById('buscar').value.trim();
    const formData = new FormData();
    
    formData.append('action', 'buscar');
    formData.append('termino', termino);
    
    fetch('examenes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarExamenes(data.examenes);
            if (termino) {
                showToast(`Se encontraron ${data.examenes.length} exámenes`, 'info', 2000);
            }
        } else {
            console.error('Error:', data.message);
            showToast('Error al buscar exámenes: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al buscar exámenes', 'error');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarExamenes();
}