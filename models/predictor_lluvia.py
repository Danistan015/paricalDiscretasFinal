import pandas as pd
from sklearn.linear_model import LinearRegression

modelo_entrenado = None

def entrenar_modelo(df):
    global modelo_entrenado

    # Convertir fecha y milimetros
    df['DIA'] = pd.to_datetime(df['DIA'])
    df['MILIMETROS LLUVIA'] = df['MILIMETROS LLUVIA'].astype(str).str.replace(',', '.').astype(float)

    # Crear variables para regresión
    X = df[['DIA']].copy()
    X['DIA'] = df['DIA'].dt.day
    X['MES'] = df['MES']
    X['AÑO'] = df['AÑO']

    y = df['MILIMETROS LLUVIA']

    modelo = LinearRegression()
    modelo.fit(X[['DIA', 'MES', 'AÑO']], y)

    modelo_entrenado = modelo

def predecir_lluvia(dia, mes, anio):
    global modelo_entrenado
    if not modelo_entrenado:
        raise ValueError("El modelo aún no ha sido entrenado.")
    
    prediccion = modelo_entrenado.predict([[dia, mes, anio]])
    return round(prediccion[0], 2)
