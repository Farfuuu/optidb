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

// -------------------------------------------------------------
//  LÓGICA DE UTILIDAD (Integrada desde el módulo de clientes)
// -------------------------------------------------------------

function formatearTelefono(input) {
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length > 3 && valor.length <= 6) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3);
    } else if (valor.length > 6) {
        valor = valor.substring(0, 3) + '-' + valor.substring(3, 6) + '-' + valor.substring(6, 10);
    }
    
    input.value = valor;
}

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

function inicializarFormatoTelefono() {
    // Busca inputs de teléfono para la forma de agregar y editar ventas
    const inputsTelefono = document.querySelectorAll('#formAgregar input[type="text"][id*="telefono"], #formEditar input[type="text"][id*="telefono"]');
    
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


// -------------------------------------------------------------
//  FUNCIÓN CLAVE: BÚSQUEDA PARA AUTOCOMPLETAR
// -------------------------------------------------------------
function buscarClienteParaAutocompletar() {
    // Usamos 'nombre_cliente' basado en el formData de agregarVenta
    const nombreInput = document.getElementById('nombre_cliente'); 
    const nombre = nombreInput ? nombreInput.value.trim() : '';

    // Solo busca si hay al menos 3 caracteres
    if (nombre.length < 3) return;

    const formData = new FormData();
    formData.append('action', 'buscar'); // Llama a buscarClientes() en clientes_ajax.php
    formData.append('termino', nombre);

    fetch('clientes_ajax.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Asumimos que los IDs de los campos son 'telefono' y 'email' en el formulario de ventas
        const telInput = document.getElementById('telefono');
        const emailInput = document.getElementById('email');
        
        if (data.success && data.clientes.length > 0) {
            // Cliente ENCONTRADO - Autocompletar con el primer resultado
            const cliente = data.clientes[0];
            
            if (telInput) {
                telInput.value = cliente.telefono || '';
                formatearTelefono(telInput);
            }
            if (emailInput) emailInput.value = cliente.email || '';
            
            showToast(`Cliente '${cliente.nombre}' encontrado. Datos autocompletados.`, 'info', 2000);

        } else {
            // Cliente NO ENCONTRADO - Limpiar campos
            if (telInput) telInput.value = '';
            if (emailInput) emailInput.value = '';
            
            showToast(`Cliente no encontrado. Ingresa los datos completos.`, 'info', 1500);
        }
    })
    .catch(error => {
        console.error('Error de conexión al buscar cliente para autocompletar:', error);
        showToast('Error de conexión al buscar cliente', 'error');
    });
}
// -------------------------------------------------------------


// Cargar ventas al iniciar
document.addEventListener('DOMContentLoaded', function() {
    // IMPORTANTE: Inicializamos el formateador de teléfono ANTES de cargar ventas
    inicializarFormatoTelefono(); 
    
    cargarVentas();
    
    // ----------------------------------------------------------------
    // 🟢 CÓDIGO AÑADIDO: Listener para AUTOCOMPLETADO
    // ----------------------------------------------------------------
    const nombreClienteInput = document.getElementById('nombre_cliente'); 
    if (nombreClienteInput) {
        // Ejecuta la búsqueda al perder el foco del campo
        nombreClienteInput.addEventListener('blur', buscarClienteParaAutocompletar);
    }
    // ----------------------------------------------------------------
    
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

// Sistema de notificaciones Toast (MODIFICADO: Sin emojis ni iconos)
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
    
    // Eliminado el código de iconos/emojis para cumplir con la solicitud
    toast.innerHTML = `
        <div class="toast-content">
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

// Función para confirmación con Toast (MODIFICADO: Sin emojis)
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
                    <p>Fecha: ${fechaFormateada}</p>
                    <p>Total: ${totalFormateado}</p>
                    <p>Armazón: ${venta.tipo_armazon || 'N/A'}</p>
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
    const fechaTexto = ventaItem.querySelector('p:nth-child(2)').textContent.replace(' Fecha: ', '');
    const totalTexto = ventaItem.querySelector('p:nth-child(3)').textContent.replace(' Total: ', '');
    const armazon = ventaItem.querySelector('p:nth-child(4)').textContent.replace(' Armazón: ', '');
    
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
