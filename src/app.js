const express = require('express');
const cors = require('cors');
const { conectarDB } = require('./db');
const personas = require('./routes/personas');
const { cargarDatosEjemplo } = require('./seed');

// Express 5 propaga errores de rutas async al manejador de errores
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    api: 'API Árbol Genealógico (hasta 2.º grado de consanguinidad)',
    version: '1.0.0',
    persistencia: 'MongoDB Atlas (nube)',
    endpoints: {
      'GET    /api/personas': 'Listar personas (filtros opcionales: ?nombre=&apellido=&genero=M|F)',
      'GET    /api/personas/:id': 'Consultar una persona',
      'POST   /api/personas': 'Crear persona { nombre, apellido, genero: "M"|"F", fechaNacimiento?, fechaFallecimiento?, padreId?, madreId? }',
      'PUT    /api/personas/:id': 'Reemplazar persona (todos los campos)',
      'PATCH  /api/personas/:id': 'Actualizar campos de una persona',
      'DELETE /api/personas/:id': 'Eliminar persona (sus hijos quedan sin ese padre/madre)',
      'GET    /api/personas/:id/arbol': 'Familiares de 1.er grado (padres, hijos) y 2.º grado (abuelos, hermanos, nietos)',
      'GET    /api/personas/:id/parentesco/:otroId': 'Parentesco entre dos personas',
      'POST   /api/seed': 'Borra todo y carga una familia de ejemplo',
      'GET    /api/health': 'Estado de la API y la base de datos',
    },
  });
});

app.use('/api', async (_req, _res, next) => {
  await conectarDB();
  next();
});

app.get('/api/health', async (_req, res) => {
  const mongoose = require('mongoose');
  res.json({ estado: 'ok', baseDeDatos: mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada' });
});

app.post('/api/seed', async (_req, res) => {
  res.status(201).json(await cargarDatosEjemplo());
});

app.use('/api/personas', personas);

app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let status = err.status || 500;
  let error = err.message;
  if (err.name === 'ValidationError') {
    status = 400;
    error = Object.values(err.errors).map((e) => e.message).join('; ');
  } else if (err.name === 'CastError') {
    status = 400;
    error = `Valor inválido para ${err.path}: ${JSON.stringify(err.value)}`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    error = 'El cuerpo de la petición no es un JSON válido';
  }
  if (status === 500) console.error(err);
  res.status(status).json({ error });
});

module.exports = app;
