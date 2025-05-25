document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-csv');
  const resultadoDiv = document.getElementById('resultado');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const archivoInput = document.getElementById('archivo_csv');
    if (archivoInput.files.length === 0) {
      resultadoDiv.innerHTML = '<p style="color: red;">Por favor, selecciona un archivo CSV.</p>';
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
        resultadoDiv.innerHTML = `<p style="color: red;">Error: ${errorData.error}</p>`;
        return;
      }

      const data = await response.json();

      // Mostrar estadísticas
      let html = `
        <h3>Estadísticas calculadas:</h3>
        <ul>
          <li>Total de lluvia: ${data.total_lluvia.toFixed(2)} mm</li>
          <li>Promedio de lluvia: ${data.promedio_lluvia.toFixed(2)} mm</li>
          <li>Máximo de lluvia en un día: ${data.max_lluvia.toFixed(2)} mm</li>
          <li>Cantidad de registros: ${data.cantidad_registros}</li>
        </ul>
      `;

      // Mostrar tabla completa con registros
      html += `<h3>Datos completos:</h3>`;
      html += `<table border="1" cellpadding="5" cellspacing="0"><thead><tr>
        <th>Día</th><th>Mes</th><th>Año</th><th>Milímetros</th>
      </tr></thead><tbody>`;

      data.registros.forEach(registro => {
        html += `<tr>
          <td>${registro.dia}</td>
          <td>${registro.mes}</td>
          <td>${registro.anio}</td>
          <td>${registro.milimetros}</td>
        </tr>`;
      });

      html += `</tbody></table>`;

      resultadoDiv.innerHTML = html;

    } catch (error) {
      resultadoDiv.innerHTML = `<p style="color: red;">Error en la petición: ${error.message}</p>`;
    }
  });
});
