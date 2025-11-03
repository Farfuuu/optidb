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
});

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
            alert('Error al cargar clientes: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al cargar clientes');
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
            cargarClientes(); // Recargar la lista
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

function editarClienteForm(id) {
    // Obtener los datos actuales del cliente
    const clienteItem = document.querySelector(`.cliente-item[data-id="${id}"]`);
    const nombre = clienteItem.querySelector('h4').textContent;
    const telefono = clienteItem.querySelector('p:nth-child(2)').textContent.replace('📞 ', '');
    const email = clienteItem.querySelector('p:nth-child(3)').textContent.replace('📧 ', '');
    const tipo_cliente = clienteItem.querySelector('p:nth-child(4)').textContent.replace('🏷️ ', '');
    
    // Rellenar formulario de edición
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nombre').value = nombre;
    document.getElementById('edit_telefono').value = telefono === 'No especificado' ? '' : telefono;
    document.getElementById('edit_email').value = email === 'No especificado' ? '' : email;
    document.getElementById('edit_tipo_cliente').value = tipo_cliente;
    
    // Mostrar formulario de edición
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
            cargarClientes(); // Recargar la lista
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

function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
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
            alert(data.message);
            cargarClientes();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        alert('Error de conexión: ' + error);
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
        } else {
            console.error('Error:', data.message);
            alert('Error al buscar clientes: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al buscar clientes');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarClientes();
}