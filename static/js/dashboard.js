document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const menuUpload = document.getElementById('menu-upload');
  const menuDatos = document.getElementById('menu-datos');

  // Cargar las vistas de dashboard.html usando fetch
  async function cargarVistas() {
    const resp = await fetch('/dashboard/views');
    const html = await resp.text();
    mainContent.innerHTML = html;
  }

  // Mostrar vista y actualizar menú
  function mostrarVista(vistaId) {
    const views = mainContent.querySelectorAll('div[id^="view-"]');
    views.forEach(v => v.classList.add('d-none'));
    mainContent.querySelector(`#${vistaId}`).classList.remove('d-none');

    // Actualizar clases del menú
    menuUpload.classList.remove('active');
    menuDatos.classList.remove('active');
    if (vistaId === 'view-upload') menuUpload.classList.add('active');
    else if (vistaId === 'view-datos') menuDatos.classList.add('active');
  }

  // Cargar vistas inicialmente
  cargarVistas().then(() => {
    // Mostrar vista subida al inicio
    mostrarVista('view-upload');

    // Eventos menú
    menuUpload.addEventListener('click', e => {
      e.preventDefault();
      mostrarVista('view-upload');
    });

    menuDatos.addEventListener('click', e => {
      e.preventDefault();
      cargarDatosLocal();
      mostrarVista('view-datos');
    });

    // Formulario de carga
    const form = document.getElementById('form-csv');
    const resultadoDiv = document.getElementById('resultado');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const archivoInput = document.getElementById('archivo_csv');
      if (archivoInput.files.length === 0) {
        resultadoDiv.innerHTML = '<p class="text-danger">Por favor, selecciona un archivo.</p>';
        return;
      }

      const formData = new FormData();
      formData.append('archivo_csv', archivoInput.files[0]);

      try {
        resultadoDiv.innerHTML = 'Procesando...';

        const response = await fetch('/estadistica/cargar-datos', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          resultadoDiv.innerHTML = `<p class="text-danger">Error: ${errorData.error}</p>`;
          return;
        }

        const data = await response.json();

        // Guardar data completa en localStorage (como string JSON)
        localStorage.setItem('datosLluvia', JSON.stringify(data));

        // Mostrar resumen y tabla en vista datos
        mostrarDatos(data);

        resultadoDiv.innerHTML = '<p class="text-success">Archivo procesado correctamente. Ve a "Ver Datos" para la tabla.</p>';
      } catch (error) {
        resultadoDiv.innerHTML = `<p class="text-danger">Error en la petición: ${error.message}</p>`;
      }
    });
  });

  // Mostrar datos y tabla
  function mostrarDatos(data) {
    const contEstadisticas = document.getElementById('estadisticas');
    const contTabla = document.getElementById('tabla-datos');

    contEstadisticas.innerHTML = `
      <h3>Estadísticas calculadas:</h3>
      <ul>
        <li>Total de lluvia: ${data.total_lluvia.toFixed(2)} mm</li>
        <li>Promedio de lluvia: ${data.promedio_lluvia.toFixed(2)} mm</li>
        <li>Máximo de lluvia en un día: ${data.max_lluvia.toFixed(2)} mm</li>
        <li>Cantidad de registros: ${data.cantidad_registros}</li>
      </ul>
    `;

    let tablaHtml = `<table class="table table-striped table-bordered">
      <thead class="table-dark">
        <tr>
          <th>Día</th><th>Mes</th><th>Año</th><th>Milímetros</th>
        </tr>
      </thead>
      <tbody>`;

    data.registros.forEach(registro => {
      tablaHtml += `<tr>
        <td>${registro.dia}</td>
        <td>${registro.mes}</td>
        <td>${registro.anio}</td>
        <td>${registro.milimetros}</td>
      </tr>`;
    });

    tablaHtml += '</tbody></table>';

    contTabla.innerHTML = tablaHtml;
  }

  // Cargar datos guardados en localStorage
  function cargarDatosLocal() {
    const datosStr = localStorage.getItem('datosLluvia');
    if (!datosStr) {
      alert('No hay datos guardados. Por favor sube un archivo primero.');
      mostrarVista('view-upload');
      return;
    }
    const data = JSON.parse(datosStr);
    mostrarDatos(data);
  }
});
