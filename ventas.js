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
});

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
            alert('Error al cargar ventas: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al cargar ventas');
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
            
            cargarVentas(); // Recargar la lista
        } else {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje error';
        }
    })
    .catch(error => {
        mensaje.textContent = 'Error de conexión: ' + error;
        mensaje.className = 'mensaje error';
    })
    .finally(() => {
        setTimeout(() => {
            mensaje.style.display = 'none';
        }, 3000);
    });
}

function editarVentaForm(id) {
    // Obtener los datos actuales de la venta
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
    
    // Rellenar formulario de edición
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nombre_cliente').value = nombre;
    document.getElementById('edit_fecha_venta').value = fechaFormateada;
    document.getElementById('edit_total').value = totalNumero;
    document.getElementById('edit_tipo_armazon').value = armazon === 'N/A' ? '' : armazon;
    
    // Mostrar formulario de edición
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
            cargarVentas(); // Recargar la lista
        } else {
            mensaje.textContent = data.message;
            mensaje.className = 'mensaje error';
        }
    })
    .catch(error => {
        mensaje.textContent = 'Error de conexión: ' + error;
        mensaje.className = 'mensaje error';
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

function eliminarVenta(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
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
            alert(data.message);
            cargarVentas();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        alert('Error de conexión: ' + error);
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
        } else {
            console.error('Error:', data.message);
            alert('Error al buscar ventas: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al buscar ventas');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarVentas();
}