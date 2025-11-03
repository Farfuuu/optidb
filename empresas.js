// Cargar empresas al iniciar
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
});

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
            alert('Error al cargar empresas: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al cargar empresas');
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
            cargarEmpresas(); // Recargar la lista
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

function editarEmpresaForm(id) {
    // Obtener los datos actuales de la empresa
    const empresaItem = document.querySelector(`.cliente-item[data-id="${id}"]`);
    const nombre = empresaItem.querySelector('h4').textContent;
    const telefono = empresaItem.querySelector('p:nth-child(2)').textContent.replace('📞 ', '');
    const email = empresaItem.querySelector('p:nth-child(3)').textContent.replace('📧 ', '');
    const direccion = empresaItem.querySelector('p:nth-child(4)').textContent.replace('🏢 ', '');
    const rfc = empresaItem.querySelector('p:nth-child(5)').textContent.replace('📋 RFC: ', '');
    
    // Rellenar formulario de edición
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_nombre').value = nombre;
    document.getElementById('edit_telefono').value = telefono === 'N/A' ? '' : telefono;
    document.getElementById('edit_email').value = email === 'N/A' ? '' : email;
    document.getElementById('edit_direccion').value = direccion === 'N/A' ? '' : direccion;
    document.getElementById('edit_rfc').value = rfc === 'N/A' ? '' : rfc;
    
    // Mostrar formulario de edición
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
            cargarEmpresas(); // Recargar la lista
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

function eliminarEmpresa(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
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
            alert(data.message);
            cargarEmpresas();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        alert('Error de conexión: ' + error);
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
        } else {
            console.error('Error:', data.message);
            alert('Error al buscar empresas: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al buscar empresas');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarEmpresas();
}