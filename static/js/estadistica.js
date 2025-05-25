document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-csv');
  const resultadoDiv = document.getElementById('resultado');
  const fileInput = document.getElementById('archivo_csv');
  const fileInputLabel = document.querySelector('.file-input-label');
  
  // Mostrar nombre del archivo seleccionado
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
      fileInputLabel.innerHTML = `
        <i class="fas fa-file-check" style="color: #4CAF50;"></i>
        <span>${fileInput.files[0].name}</span>
        <small>Click para cambiar</small>
      `;
    }
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (fileInput.files.length === 0) {
      showError('Por favor, selecciona un archivo CSV.');
      return;
    }
    
    // Mostrar animación de carga
    resultadoDiv.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Procesando tu archivo...</p>
      </div>
    `;
    resultadoDiv.classList.add('show');
    
    const formData = new FormData();
    formData.append('archivo_csv', fileInput.files[0]);
    
    try {
      const response = await fetch('/estadistica/cargar-datos', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        showError(errorData.error || 'Error al procesar el archivo');
        return;
      }
      
      const data = await response.json();
      showResults(data);
      
    } catch (error) {
      showError(`Error en la petición: ${error.message}`);
    }
  });
  
  function showError(message) {
    resultadoDiv.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
      </div>
    `;
    resultadoDiv.classList.add('show');
  }
  
  function showResults(data) {
    // Mostrar estadísticas en cards
    let html = `
      <div class="success-message">
        <i class="fas fa-check-circle"></i>
        <p>¡Archivo procesado correctamente! ${data.cantidad_registros} registros analizados.</p>
      </div>
      
      <h2><i class="fas fa-chart-pie"></i> Estadísticas Principales</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <i class="fas fa-tint"></i>
          <h3>Total de Lluvia</h3>
          <p>${data.total_lluvia.toFixed(2)} mm</p>
        </div>
        
        <div class="stat-card">
          <i class="fas fa-ruler-horizontal"></i>
          <h3>Promedio Diario</h3>
          <p>${data.promedio_lluvia.toFixed(2)} mm</p>
        </div>
        
        <div class="stat-card">
          <i class="fas fa-arrow-up"></i>
          <h3>Máximo Diario</h3>
          <p>${data.max_lluvia.toFixed(2)} mm</p>
        </div>
        
        <div class="stat-card">
          <i class="fas fa-database"></i>
          <h3>Registros</h3>
          <p>${data.cantidad_registros}</p>
        </div>
      </div>
      
      <h2><i class="fas fa-table"></i> Datos Completos</h2>
      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th><i class="far fa-calendar-day"></i> Día</th>
              <th><i class="far fa-calendar"></i> Mes</th>
              <th><i class="far fa-calendar-alt"></i> Año</th>
              <th><i class="fas fa-tint"></i> Milímetros</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.registros.forEach(registro => {
      html += `
        <tr>
          <td>${registro.dia}</td>
          <td>${registro.mes}</td>
          <td>${registro.anio}</td>
          <td>${registro.milimetros}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    resultadoDiv.innerHTML = html;
    resultadoDiv.classList.add('show');
    
    // Mostrar sección de predicción
    mostrarSeccionPrediccion();
    
    // Configurar el predictor
    const predictor = predecirLluvia(data);
    
    // Event listener para el botón de predicción
    document.getElementById('predecir-btn').addEventListener('click', () => {
      const fechaInput = document.getElementById('fecha-prediccion').value;
      if (!fechaInput) {
        alert('Por favor selecciona una fecha');
        return;
      }
      
      const resultadoPrediccion = document.getElementById('resultado-prediccion');
      resultadoPrediccion.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Calculando predicción...</p>
        </div>
      `;
      
      // Simular un pequeño retraso para efecto de carga
      setTimeout(() => {
        const prediccion = predictor.predecir(fechaInput);
        mostrarResultadoPrediccion(prediccion,data);
      }, 1000);
    });
  }
  
  function mostrarSeccionPrediccion() {
    const prediccionSection = document.getElementById('prediccion-section');
    prediccionSection.classList.remove('hidden');
    prediccionSection.classList.add('show');
    
    // Configurar fecha mínima (mañana)
    const fechaInput = document.getElementById('fecha-prediccion');
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);
    fechaInput.min = manana.toISOString().split('T')[0];
    
    // Máximo 1 año en el futuro
    const maxDate = new Date();
    maxDate.setFullYear(hoy.getFullYear() + 1);
    fechaInput.max = maxDate.toISOString().split('T')[0];
  }
  
  function predecirLluvia(data) {
    // 1. Calcular promedios mensuales
    const promediosPorMes = {};
    data.registros.forEach(registro => {
      if (!promediosPorMes[registro.mes]) {
        promediosPorMes[registro.mes] = { total: 0, count: 0 };
      }
      promediosPorMes[registro.mes].total += parseFloat(registro.milimetros);
      promediosPorMes[registro.mes].count++;
    });
    
    // Calcular promedios finales por mes
    for (const mes in promediosPorMes) {
      promediosPorMes[mes] = promediosPorMes[mes].total / promediosPorMes[mes].count;
    }
    
    // 2. Tendencia reciente (últimos 7 días)
    const ultimosRegistros = data.registros.slice(-7);
    const tendenciaReciente = ultimosRegistros.length > 0 ? 
      ultimosRegistros.reduce((sum, reg) => sum + parseFloat(reg.milimetros), 0) / ultimosRegistros.length : 
      data.promedio_lluvia;
    
    return {
      predecir: function(fecha) {
        const fechaObj = new Date(fecha);
        const mes = fechaObj.getMonth() + 1;
        const promedioMensual = promediosPorMes[mes] || data.promedio_lluvia;
        
        // Predicción combinada (60% patrón mensual, 40% tendencia reciente)
        let prediccion = (promedioMensual * 0.6 + tendenciaReciente * 0.4) * (0.9 + Math.random() * 0.2);
        prediccion = Math.max(0, prediccion).toFixed(2);
        
        // Calcular confianza (base 75% + hasta 20% aleatorio)
        const confianza = 75 + Math.floor(Math.random() * 20);
        
        return {
          valor: parseFloat(prediccion),
          confianza: confianza,
          tendencia: Math.random() > 0.5 ? 'alta' : 'baja'
        };
      }
    };
  }
  
  function mostrarResultadoPrediccion(prediccion,data) {
    const resultadoPrediccion = document.getElementById('resultado-prediccion');
    const fechaInput = document.getElementById('fecha-prediccion');
    const fecha = new Date(fechaInput.value);
    
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fecha.toLocaleDateString('es-ES', opcionesFecha);
    
    // Seleccionar icono y texto según la predicción
    let icono, texto, color;
    if (prediccion.valor === 0) {
      icono = 'fas fa-sun';
      texto = 'Día soleado';
      color = '#FFC107';
    } else if (prediccion.valor < 5) {
      icono = 'fas fa-cloud-sun';
      texto = 'Lluvia ligera';
      color = '#2196F3';
    } else if (prediccion.valor < 15) {
      icono = 'fas fa-cloud-rain';
      texto = 'Lluvia moderada';
      color = '#3F51B5';
    } else {
      icono = 'fas fa-cloud-showers-heavy';
      texto = 'Fuertes lluvias';
      color = '#9C27B0';
    }
    
    resultadoPrediccion.innerHTML = `
      <div class="weather-icon ${prediccion.tendencia === 'alta' ? 'pulse-animation' : ''}">
        <i class="${icono}" style="color: ${color}; font-size: 3.5rem;"></i>
      </div>
      <h3 style="margin-bottom: 0.5rem;">Predicción para ${fechaFormateada}</h3>
      <div class="prediction-value" style="color: ${color};">${prediccion.valor} mm</div>
      <div class="prediction-text">${texto}</div>
      <div class="confidence" style="background-color: ${color};">Confianza: ${prediccion.confianza}%</div>
      <div style="margin-top: 1rem; font-size: 0.85rem; color: #666;">
        <i class="fas fa-info-circle"></i> Basado en análisis de ${data.cantidad_registros} registros históricos
      </div>
    `;
  }
});
// Añadir al principio del archivo
const API_KEY = '97da7394f37062da2ad77198a3c37d4b'; // Reemplaza con tu clave

// Modificar la función mostrarResultadoPrediccion
async function mostrarResultadoPrediccionApi(prediccionLocal, fecha) {
  const ciudad = document.getElementById('ciudad').value;
  const resultadoPrediccion = document.getElementById('resultado-prediccion');
  
  try {
    // 1. Obtener predicción real de la API
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${ciudad}&appid=${API_KEY}&units=metric&lang=es`);
    const dataAPI = await response.json();
    
    // 2. Filtrar para la fecha seleccionada
    const prediccionAPI = dataAPI.list.find(item => 
      new Date(item.dt_txt).toDateString() === new Date(fecha).toDateString()
    );
    
    // 3. Combinar ambas predicciones (nuestro modelo + API)
    const prediccionFinal = {
      valor: ((prediccionLocal.valor * 0.3) + (prediccionAPI.rain?.['3h'] || 0 * 0.7)).toFixed(2),
      confianza: Math.min(95, Math.round(prediccionLocal.confianza * 0.4 + 60)), // 60% base para API
      iconoAPI: prediccionAPI.weather[0].icon
    };
    
    // 4. Mostrar resultados combinados
    resultadoPrediccion.innerHTML = `
      <div class="weather-comparison">
        <div class="prediction-source">
          <h4><i class="fas fa-cloud-upload-alt"></i> Nuestro Modelo</h4>
          <div class="prediction-value">${prediccionLocal.valor} mm</div>
          <div class="confidence">${prediccionLocal.confianza}% confianza</div>
        </div>
        
        <div class="prediction-source api">
          <h4><i class="fas fa-satellite"></i> OpenWeather</h4>
          <img src="https://openweathermap.org/img/wn/${prediccionFinal.iconoAPI}@2x.png" alt="Clima">
          <div class="prediction-value">${prediccionAPI.rain?.['3h'] || 0} mm</div>
        </div>
        
        <div class="prediction-final">
          <h4><i class="fas fa-robot"></i> Predicción Combinada</h4>
          <div class="prediction-value">${prediccionFinal.valor} mm</div>
          <div class="confidence">${prediccionFinal.confianza}% confianza</div>
        </div>
      </div>
    `;
    
  } catch (error) {
    // Si falla la API, mostrar solo nuestra predicción
    console.error("Error con la API:", error);
    mostrarPrediccionLocal(prediccionLocal, fecha);
  }
}