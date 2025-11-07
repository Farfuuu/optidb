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

// Cargar clientes al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarClientes();
    
    // Manejar formulario de agregar
    document.getElementById('formAgregar').addEventListener('submit', function(e) {
        e.preventDefault();
        agregarCliente();
    });
    
    // Manejar formulario de editar
    document.getElementById('formEditar').addEventListener('submit', function(e) {
        e.preventDefault();
        editarCliente();
    });
    
    // Inicializar formato de teléfono
    inicializarFormatoTelefono();
    
    // Agregar event listener para Enter en el campo de búsqueda
    document.getElementById('buscar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarClientes();
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

function cargarClientes() {
    const formData = new FormData();
    formData.append('action', 'obtener');
    
    fetch('clientes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarClientes(data.clientes);
        } else {
            console.error('Error:', data.message);
            showToast('Error al cargar clientes: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al cargar clientes', 'error');
    });
}

function mostrarClientes(clientes) {
    const lista = document.getElementById('listaClientes');
    const total = document.getElementById('totalClientes');
    
    lista.innerHTML = '';
    total.textContent = `${clientes.length} clientes`;
    
    if (clientes.length === 0) {
        lista.innerHTML = '<p class="placeholder">No hay clientes registrados</p>';
        return;
    }
    
    clientes.forEach(cliente => {
        const clienteHTML = `
            <div class="cliente-item" data-id="${cliente.id}">
                <div class="cliente-info">
                    <h4>${cliente.nombre}</h4>
                    <p>📞 ${cliente.telefono || 'No especificado'}</p>
                    <p>📧 ${cliente.email || 'No especificado'}</p>
                    <p>🏷️ ${cliente.tipo_cliente || 'Regular'}</p>
                </div>
                <div class="cliente-acciones">
                    <button class="btn-editar" onclick="editarClienteForm(${cliente.id})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarCliente(${cliente.id})">Eliminar</button>
                </div>
            </div>
        `;
        lista.innerHTML += clienteHTML;
    });
}

function agregarCliente() {
    const formData = new FormData(document.getElementById('formAgregar'));
    const mensaje = document.getElementById('mensajeAgregar');
    
    formData.append('action', 'agregar');
    
    mensaje.textContent = 'Agregando cliente...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('clientes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje success';
            document.getElementById('formAgregar').reset();
            cargarClientes();
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

function editarClienteForm(id) {
    const clienteItem = document.querySelector(`.cliente-item[data-id="${id}"]`);
    const nombre = clienteItem.querySelector('h4').textContent;
    const telefono = clienteItem.querySelector('p:nth-child(2)').textContent.replace('📞 ', '');
    const email = clienteItem.querySelector('p:nth-child(3)').textContent.replace('📧 ', '');
    const tipo_cliente = clienteItem.querySelector('p:nth-child(4)').textContent.replace('🏷️ ', '');
    
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nombre').value = nombre;
    
    let telefonoValue = telefono === 'No especificado' ? '' : telefono;
    document.getElementById('edit_telefono').value = telefonoValue;
    formatearTelefono(document.getElementById('edit_telefono'));
    
    document.getElementById('edit_email').value = email === 'No especificado' ? '' : email;
    document.getElementById('edit_tipo_cliente').value = tipo_cliente;
    
    document.getElementById('formEditar').style.display = 'block';
    document.getElementById('mensajeEditar').style.display = 'none';
}

function editarCliente() {
    const formData = new FormData(document.getElementById('formEditar'));
    const mensaje = document.getElementById('mensajeEditar');
    
    formData.append('action', 'editar');
    
    mensaje.textContent = 'Actualizando cliente...';
    mensaje.className = 'mensaje loading';
    mensaje.style.display = 'block';
    
    fetch('clientes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje success';
            document.getElementById('formEditar').style.display = 'none';
            cargarClientes();
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

async function eliminarCliente(id) {
    const confirmacion = await confirmWithToast('¿Estás seguro de que quieres eliminar este cliente?');
    
    if (!confirmacion) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'eliminar');
    formData.append('id', id);
    
    fetch('clientes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(data.message, 'success');
            cargarClientes();
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showToast('Error de conexión: ' + error, 'error');
    });
}

function buscarClientes() {
    const termino = document.getElementById('buscar').value.trim();
    const formData = new FormData();
    
    formData.append('action', 'buscar');
    formData.append('termino', termino);
    
    fetch('clientes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarClientes(data.clientes);
            if (termino) {
                showToast(`Se encontraron ${data.clientes.length} clientes`, 'info', 2000);
            }
        } else {
            console.error('Error:', data.message);
            showToast('Error al buscar clientes: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error de conexión al buscar clientes', 'error');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarClientes();
}