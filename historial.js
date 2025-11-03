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
});

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
            alert('Error al cargar historiales: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al cargar historiales');
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
            
            cargarHistoriales(); // Recargar la lista
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

function editarHistorialForm(id) {
    // Obtener los datos actuales del historial
    const historialItem = document.querySelector(`.historial-item[data-id="${id}"]`);
    const nombre = historialItem.querySelector('h4').textContent;
    const idHistorial = historialItem.querySelector('p:nth-child(2)').textContent.replace('📋 ID: ', '');
    const fechaTexto = historialItem.querySelector('p:nth-child(3)').textContent.replace('📅 Fecha: ', '');
    const descripcion = historialItem.querySelector('p:nth-child(4)').textContent;
    const cirugias = historialItem.querySelector('p:nth-child(5)').textContent.replace('🏥 Cirugías: ', '');
    
    // Convertir fecha al formato YYYY-MM-DD
    const [dia, mes, anio] = fechaTexto.split('/');
    const fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    
    // Rellenar formulario de edición
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_id_historial').value = idHistorial === 'N/A' ? '' : idHistorial;
    document.getElementById('edit_nombre_paciente').value = nombre;
    document.getElementById('edit_fecha_historial').value = fechaFormateada;
    document.getElementById('edit_descripcion').value = descripcion === 'Sin descripción' ? '' : descripcion;
    document.getElementById('edit_cirugias_previas').value = cirugias === 'Ninguna' ? '' : cirugias;
    
    // Mostrar formulario de edición
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
            cargarHistoriales(); // Recargar la lista
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

function eliminarHistorial(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este historial?')) {
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
            alert(data.message);
            cargarHistoriales();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        alert('Error de conexión: ' + error);
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
        } else {
            console.error('Error:', data.message);
            alert('Error al buscar historiales: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al buscar historiales');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarHistoriales();
}