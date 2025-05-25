from flask import Flask, render_template
from routes.estadistica_routes import estadistica_bp  # si usas blueprint

app = Flask(__name__)

# Registrar el blueprint si tienes uno
app.register_blueprint(estadistica_bp)

# Ruta raíz
@app.route('/')
def index():
    return render_template('estadistica_form.html')
