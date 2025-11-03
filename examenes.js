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
});

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
            alert('Error al cargar exámenes: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al cargar exámenes');
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
            
            cargarExamenes(); // Recargar la lista
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

function editarExamenForm(id) {
    // Obtener los datos actuales del examen
    const examenItem = document.querySelector(`.examen-item[data-id="${id}"]`);
    const nombre = examenItem.querySelector('h4').textContent;
    const idExamen = examenItem.querySelector('p:nth-child(2)').textContent.replace('📋 ID: ', '');
    const fechaTexto = examenItem.querySelector('p:nth-child(3)').textContent.replace('📅 Fecha: ', '');
    const graduaciones = examenItem.querySelector('p:nth-child(4)').textContent.replace('👁️ OI: ', '').split(' | OD: ');
    
    // Convertir fecha al formato YYYY-MM-DD
    const [dia, mes, anio] = fechaTexto.split('/');
    const fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    
    // Rellenar formulario de edición
    document.getElementById('edit_id').value = id;
    document.getElementById('edit_id_examen').value = idExamen === 'N/A' ? '' : idExamen;
    document.getElementById('edit_nombre_paciente').value = nombre;
    document.getElementById('edit_fecha_examen').value = fechaFormateada;
    document.getElementById('edit_graduacion_oi').value = graduaciones[0] === 'N/A' ? '' : graduaciones[0];
    document.getElementById('edit_graduacion_od').value = graduaciones[1] === 'N/A' ? '' : graduaciones[1];
    
    // Mostrar formulario de edición
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
            cargarExamenes(); // Recargar la lista
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

function eliminarExamen(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este examen?')) {
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
            alert(data.message);
            cargarExamenes();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        alert('Error de conexión: ' + error);
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
        } else {
            console.error('Error:', data.message);
            alert('Error al buscar exámenes: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al buscar exámenes');
    });
}

function mostrarTodo() {
    document.getElementById('buscar').value = '';
    cargarExamenes();
}