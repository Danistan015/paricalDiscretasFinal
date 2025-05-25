from datetime import datetime

class RegistroLluvia:
    def __init__(self, dia, mes, anio, milimetros):
        self.dia = dia             
        self.mes = mes
        self.anio = anio
        self.milimetros = milimetros

    def to_dict(self):
        return {
            'dia': self.dia,
            'mes': self.mes,
            'anio': self.anio,
            'milimetros': self.milimetros
        }

    def __str__(self):
        return f"{self.dia} | {self.milimetros} mm"

class EstacionClimatica:
    def __init__(self, nombre):
        self.nombre = nombre
        self.registros = []

    def agregar_registro(self, registro):
        self.registros.append(registro)

    def promedio_lluvia(self):
        if not self.registros:
            return 0
        return sum(r.milimetros for r in self.registros) / len(self.registros)

    def to_dict(self):
        return {
            'nombre': self.nombre,
            'registros': [r.to_dict() for r in self.registros]
        }

    def __str__(self):
        return f"Estación {self.nombre} con {len(self.registros)} registros"
