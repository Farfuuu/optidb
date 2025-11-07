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

/// Cargar empresas al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarEmpresas();
    
    // Manejar formulario de agregar
    document.getElementById('formAgregar').addEventListener('submit', function(e) {
        e.preventDefault();
        agregarEmpresa();
    });
    
    // Manejar formulario de editar
    document.getElementById('formEditar').addEventListener('submit', function(e) {
        e.preventDefault();
        editarEmpresa();
    });
    
    // Inicializar formato de teléfono
    inicializarFormatoTelefono();
    
    // Agregar event listener para Enter en el campo de búsqueda
    document.getElementById('buscar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarEmpresas();
        }
    });
});

// Sistema de notificaciones Toast
function showToast(message, type = 'info', duration = 5000) {
    // Crear contenedor si no existe
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Iconos según el tipo
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
    
    // Mostrar con animación
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-eliminar después del tiempo especificado
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

// Función para formatear el teléfono mientras se escribe
function formatearTelefono(input) {
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length > 3 && valor.length <= 6) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3);
    } else if (valor.length > 6) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 6) + '-' + valor.substring(6, 10);
    }
    
    input.value = valor;
}

// Función para validar que solo se ingresen números
function soloNumeros(event) {
    const tecla = event.key;
    if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(tecla)) {
        return true;
    }
    
    if (!/^\d$/.test(tecla)) {
        event.preventDefault();
        return false;
    }
    
    return true;
}

// Función para inicializar el formateo de teléfonos
function inicializarFormatoTelefono() {
    const inputsTelefono = document.querySelectorAll('input[type="text"][id*="telefono"]');
    
    inputsTelefono.forEach(input => {
        input.addEventListener('keydown', soloNumeros);
        input.addEventListener('input', function() {
            formatearTelefono(this);
        });
        
        if (input.value) {
            formatearTelefono(input);
        }
    });
}

function cargarEmpresas() {
    const formData = new FormData();
    formData.append('action', 'obtener');
    
    fetch('empresas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarEmpresas(data.empresas);
        } else {
            console.error('Error:', data.message);
            showToast('Error al cargar empresas: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al cargar empresas', 'error');
    });
}

function mostrarEmpresas(empresas) {
    const lista = document.getElementById('listaEmpresas');
    const total = document.getElementById('totalEmpresas');
    
    lista.innerHTML = '';
    total.textContent = `${empresas.length} empresas`;
    
    if (empresas.length === 0) {
        lista.innerHTML = '<p class="placeholder">No hay empresas registradas</p>';
        return;
    }
    
    empresas.forEach(empresa => {
        const empresaHTML = `
            <div class="cliente-item" data-id="${empresa.id}">
                <div class="cliente-info">
                    <h4>${empresa.nombre}</h4>
                    <p>📞 ${empresa.telefono || 'N/A'}</p>
                    <p>📧 ${empresa.email || 'N/A'}</p>
                    <p>🏢 ${empresa.direccion || 'N/A'}</p>
                    <p>📋 RFC: ${empresa.rfc || 'N/A'}</p>
                </div>
                <div class="cliente-acciones">
                    <button class="btn-editar" onclick="editarEmpresaForm(${empresa.id})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarEmpresa(${empresa.id})">Eliminar</button>
                </div>
            </div>
        `;
        lista.innerHTML += empresaHTML;
    });
}

function agregarEmpresa() {
    const formData = new FormData(document.getElementById('formAgregar'));
    const mensaje = document.getElementById('mensajeAgregar');
    
    formData.append('action', 'agregar');
    
    mensaje.textContent = 'Agregando empresa...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('empresas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje success';
            document.getElementById('formAgregar').reset();
            cargarEmpresas();
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

function editarEmpresaForm(id) {
    const empresaItem = document.querySelector(`.cliente-item[data-id="${id}"]`);
    const nombre = empresaItem.querySelector('h4').textContent;
    const telefono = empresaItem.querySelector('p:nth-child(2)').textContent.replace('📞 ', '');
    const email = empresaItem.querySelector('p:nth-child(3)').textContent.replace('📧 ', '');
    const direccion = empresaItem.querySelector('p:nth-child(4)').textContent.replace('🏢 ', '');
    const rfc = empresaItem.querySelector('p:nth-child(5)').textContent.replace('📋 RFC: ', '');
    
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nombre').value = nombre;
    
    let telefonoValue = telefono === 'N/A' ? '' : telefono;
    document.getElementById('edit_telefono').value = telefonoValue;
    formatearTelefono(document.getElementById('edit_telefono'));
    
    document.getElementById('edit_email').value = email === 'N/A' ? '' : email;
    document.getElementById('edit_direccion').value = direccion === 'N/A' ? '' : direccion;
    document.getElementById('edit_rfc').value = rfc === 'N/A' ? '' : rfc;
    
    document.getElementById('formEditar').style.display = 'block';
    document.getElementById('mensajeEditar').style.display = 'none';
}

function editarEmpresa() {
    const formData = new FormData(document.getElementById('formEditar'));
    const mensaje = document.getElementById('mensajeEditar');
    
    formData.append('action', 'editar');
    
    mensaje.textContent = 'Actualizando empresa...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('empresas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje success';
            document.getElementById('formEditar').style.display = 'none';
            cargarEmpresas();
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

async function eliminarEmpresa(id) {
    const confirmacion = await confirmWithToast('¿Estás seguro de que quieres eliminar esta empresa?');
    
    if (!confirmacion) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    
    fetch('empresas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message, 'success');
            cargarEmpresas();
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showToast('Error de conexión: ' + error, 'error');
    });
}

function buscarEmpresas() {
    const termino = document.getElementById('buscar').value.trim();
    const formData = new FormData();
    
    formData.append('action', 'buscar');
    formData.append('termino', termino);
    
    fetch('empresas_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarEmpresas(data.empresas);
            if (termino) {
                showToast(`Se encontraron ${data.empresas.length} empresas`, 'info', 2000);
            }
        } else {
            console.error('Error:', data.message);
            showToast('Error al buscar empresas: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al buscar empresas', 'error');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarEmpresas();
}