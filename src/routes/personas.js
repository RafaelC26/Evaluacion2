const express = require('express');
const Persona = require('../models/Persona');
const { esId, errorHttp, validarPadres, arbol, parentesco } = require('../services/familia');

const router = express.Router();
const CAMPOS = ['nombre', 'apellido', 'genero', 'fechaNacimiento', 'fechaFallecimiento', 'padreId', 'madreId'];

const limpiar = (body = {}) => {
  const datos = {};
  for (const c of CAMPOS) if (body[c] !== undefined) datos[c] = body[c] === '' ? null : body[c];
  return datos;
};

async function buscar(id) {
  if (!esId(id)) throw errorHttp(400, `"${id}" no es un id válido`);
  const p = await Persona.findById(id);
  if (!p) throw errorHttp(404, `No existe una persona con id ${id}`);
  return p;
}

// LISTAR (con filtros opcionales ?nombre=&apellido=&genero=)
router.get('/', async (req, res) => {
  const filtro = {};
  const escapar = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (req.query.nombre) filtro.nombre = new RegExp(escapar(req.query.nombre), 'i');
  if (req.query.apellido) filtro.apellido = new RegExp(escapar(req.query.apellido), 'i');
  if (req.query.genero) filtro.genero = String(req.query.genero).toUpperCase();
  const personas = await Persona.find(filtro).sort({ fechaNacimiento: 1, apellido: 1 });
  res.json({ total: personas.length, datos: personas });
});

// CONSULTAR UNA
router.get('/:id', async (req, res) => {
  res.json(await buscar(req.params.id));
});

// CREAR
router.post('/', async (req, res) => {
  const datos = limpiar(req.body);
  await validarPadres(datos);
  const p = await Persona.create(datos);
  res.status(201).json({ mensaje: 'Persona creada', datos: p });
});

// ACTUALIZAR (PUT reemplaza, PATCH parcial; ambos validan relaciones)
async function actualizar(req, res, completo) {
  const p = await buscar(req.params.id);
  const datos = limpiar(req.body);
  if (completo) {
    for (const c of CAMPOS) if (datos[c] === undefined) datos[c] = null;
  }
  await validarPadres(datos, p._id);
  p.set(datos);
  await p.save();
  res.json({ mensaje: 'Persona actualizada', datos: p });
}
router.put('/:id', (req, res) => actualizar(req, res, true));
router.patch('/:id', (req, res) => actualizar(req, res, false));

// ELIMINAR (los hijos quedan sin ese padre/madre)
router.delete('/:id', async (req, res) => {
  const p = await buscar(req.params.id);
  const a = await Persona.updateMany({ padreId: p._id }, { $set: { padreId: null } });
  const b = await Persona.updateMany({ madreId: p._id }, { $set: { madreId: null } });
  await p.deleteOne();
  res.json({
    mensaje: `Persona ${p.nombre} ${p.apellido} eliminada`,
    hijosDesvinculados: a.modifiedCount + b.modifiedCount,
  });
});

// ÁRBOL hasta 2.º grado de consanguinidad
router.get('/:id/arbol', async (req, res) => {
  res.json(await arbol(await buscar(req.params.id)));
});

// PARENTESCO entre dos personas
router.get('/:id/parentesco/:otroId', async (req, res) => {
  const a = await buscar(req.params.id);
  const b = await buscar(req.params.otroId);
  res.json(await parentesco(a, b));
});

module.exports = router;
