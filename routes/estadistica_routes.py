from flask import Blueprint, request, render_template, jsonify
import pandas as pd
from models.clases import RegistroLluvia, EstacionClimatica
from models.predictor_lluvia import entrenar_modelo

estadistica_bp = Blueprint('estadistica', __name__)

@estadistica_bp.route('/estadistica', methods=['GET'])
def mostrar_formulario():
    return render_template('estadistica_form.html')

@estadistica_bp.route('/estadistica/cargar-datos', methods=['POST'])
def cargar_datos():
    try:
        archivo = request.files['archivo_csv']
        if not archivo:
            return jsonify({"error": "No se recibió archivo"}), 400

        nombre_archivo = archivo.filename.lower()

        if nombre_archivo.endswith('.csv'):
            df = pd.read_csv(archivo)
        elif nombre_archivo.endswith('.xls') or nombre_archivo.endswith('.xlsx'):
            df = pd.read_excel(archivo)
        else:
            return jsonify({"error": "Formato no soportado"}), 400

        # Ajustar columnas y convertir
        df['DIA'] = pd.to_datetime(df['DIA'])
        df['MILIMETROS LLUVIA'] = df['MILIMETROS LLUVIA'].astype(str).str.replace(',', '.').astype(float)

        estacion = EstacionClimatica("Estación Principal")

        for _, row in df.iterrows():
            registro = RegistroLluvia(
                dia=row['DIA'].strftime("%Y-%m-%d"),
                mes=int(row['MES']),
                anio=int(row['AÑO']),
                milimetros=row['MILIMETROS LLUVIA']
            )
            estacion.agregar_registro(registro)

        total_lluvia = sum(r.milimetros for r in estacion.registros)
        promedio_lluvia = estacion.promedio_lluvia()
        max_lluvia = max(r.milimetros for r in estacion.registros)

        # Respuesta con estadísticas y registros completos (lista de dicts)
        respuesta = {
            "total_lluvia": total_lluvia,
            "promedio_lluvia": promedio_lluvia,
            "max_lluvia": max_lluvia,
            "cantidad_registros": len(estacion.registros),
            "registros": [r.to_dict() for r in estacion.registros]  # <- aquí están todos los registros
        }

        return jsonify(respuesta)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
